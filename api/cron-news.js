export const config = { 
    maxDuration: 60
};

// ── RSS 解析器 ────────────────────────────────────────────────────────────────
const parseFeed = (xml, sourceName) => {
    const items = [];
    const chunks = xml.split('<item>');
    for (let i = 1; i < chunks.length; i++) {
        const c = chunks[i];
        const get = (tag) => {
            const open = `<${tag}>`, close = `</${tag}>`;
            if (!c.includes(open)) return '';
            return c.split(open)[1].split(close)[0]
                .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
                .replace(/<[^>]+>/g, '').trim();
        };
        const title = get('title');
        const desc  = get('description') || get('summary');
        const link  = get('link') || get('guid');
        if (title && desc) items.push({ nlTitle: title, nlDesc: desc, url: link, source: sourceName });
    }
    return items;
};

// ── 标题标准化，用于严格查重 ─────────────────────────────────────────────────
const normalizeTitle = (t) => t.toLowerCase().replace(/[\s\-_.,!?:；，。！？]+/g, ' ').trim();

export default async function handler(req, res) {
    const authHeader = req.headers.authorization || req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // ── 1. 多源抓取 ──────────────────────────────────────────────────────
        const feeds = [
            { url: 'https://feeds.nos.nl/nosnieuwsbinnenland',       name: 'NOS 国内' },
            { url: 'https://feeds.nos.nl/nosnieuwseconomie',         name: 'NOS 经济' },
            { url: 'https://www.nu.nl/rss/Algemeen',                 name: 'NU.nl'    },
            { url: 'https://feeds.nos.nl/nosnieuwseuropaenenwereld', name: 'NOS 欧洲' },
        ];

        const feedResults = await Promise.all(
            feeds.map(f => fetch(f.url).then(r => r.text()).catch(() => '').then(xml => parseFeed(xml, f.name)))
        );
        const allItems = feedResults.flatMap(arr => arr.slice(0, 5));

        // ── 2. 拉取已有标题做严格查重 ────────────────────────────────────────
        const existRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: 'execute', stmt: { sql: 'SELECT dutch_title FROM pro_news ORDER BY id DESC LIMIT 50' } },
                    { type: 'close' }
                ]
            })
        });
        const existData = await existRes.json();
        const existingTitles = new Set(
            (existData.results?.[0]?.response?.result?.rows || [])
                .map(row => normalizeTitle(row[0]?.value || ''))
        );

        let addedCount = 0;

        for (const item of allItems) {
            if (addedCount >= 2) break;

            // 精确查重 + 子串查重
            const normNew = normalizeTitle(item.nlTitle);
            if (existingTitles.has(normNew)) continue;
            const isDuplicate = [...existingTitles].some(ex =>
                ex.length > 10 && (ex.includes(normNew) || normNew.includes(ex))
            );
            if (isDuplicate) continue;

            // ── 3. AI 编译，华人视角 prompt ──────────────────────────────────
            const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: `你是荷包管家 APP 的首席新闻主编，专门服务在荷兰的中国留学生和华人。

【读者画像】在荷兰读书/工作/生活的中国人，18-35岁，关注荷兰本地生活与欧洲大局。

【发布标准（符合其一即可）】
✅ 直接影响口袋：涨价/补贴/税/学费/银行/OV卡/汇率
✅ 荷兰社会奇闻趣事：适合和荷兰人/同学闲聊的话题
✅ 天气/交通/罢工：影响日常出行
✅ 中荷/中欧关系：签证/关税/外交
✅ 住房/能源/政策：影响日常生活的结构性变化

【坚决过滤，isRelevant=false】
❌ 纯荷兰国内党派政治（选举纷争/议会辩论）
❌ 荷兰体育赛事
❌ 与华人日常完全无关的地方事故

严格返回 JSON，不加 markdown：
{
  "isRelevant": true或false,
  "title": "吸睛中文标题，不超过20字，带情绪感",
  "aiSummary": "一句话省流，说明对荷兰华人的影响，不超过30字",
  "tag": "带Emoji短标签，如「🚨 涨价预警」「☕️ 破冰话题」「✈️ 签证」「🌧️ 天气」「💶 经济」",
  "tagColor": "#EF4444（紧急警告）或#10B981（利好省钱）或#F59E0B（提醒）或#3B82F6（日常趣事）",
  "actionText": "不超过6字行动号召",
  "detailContent": "深度编译HTML"
}

detailContent 必须包含以下模块：

<div style="margin-bottom:14px;"><b>📌 核心情报</b><br>2-3句话说清楚发生了什么，对留学生有什么影响。</div>
<div style="margin-bottom:14px;"><b>🔍 关键细节</b><br>• 要点1（数字/时间/金额要具体）<br>• 要点2<br>• 要点3（如有）</div>
<div style="background:#FEF2F2;padding:12px;border-radius:8px;color:#991B1B;margin-bottom:14px;"><b>💡 管家解读</b><br>这件事对你的实际影响是什么？需要做什么行动？</div>

如果这条新闻适合与荷兰人闲聊，额外附加：
<div style="background:#EFF6FF;padding:12px;border-radius:8px;border-left:4px solid #3B82F6;"><b>☕️ 破冰金句</b><br><span style="font-size:11px;color:#60A5FA;">遇到荷兰同学/同事可以这样开口：</span><br><br><b>🇬🇧 EN：</b>实际英语起手句 <span onclick="window.App.speak('实际英语句子','en-US')" style="cursor:pointer;padding:2px 8px;background:#BFDBFE;color:#1E3A8A;border-radius:12px;font-size:11px;margin-left:6px;font-weight:bold;">🔊</span><br><br><b>🇳🇱 NL：</b>实际荷兰语起手句 <span onclick="window.App.speak('实际荷兰语句子','nl-NL')" style="cursor:pointer;padding:2px 8px;background:#BFDBFE;color:#1E3A8A;border-radius:12px;font-size:11px;margin-left:6px;font-weight:bold;">🔊</span><br><br><b>🗣️ 接话：</b>一句观点+中文翻译</div>`
                        },
                        {
                            role: 'user',
                            content: `来源：${item.source}\n标题：${item.nlTitle}\n摘要：${item.nlDesc.slice(0, 300)}`
                        }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.4
                })
            });

            const aiData = await aiRes.json();
            if (!aiData.choices) continue;

            try {
                const raw = aiData.choices[0].message.content
                    .replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(raw);
                if (result.isRelevant !== true) continue;

                const linkHtml = item.url
                    ? `<div style="margin-top:16px;text-align:center;"><a href="${item.url}" target="_blank" style="display:inline-block;padding:10px 24px;background:#F1F5F9;color:#3B82F6;font-size:13px;font-weight:bold;border-radius:20px;text-decoration:none;">🔗 查看原新闻</a></div>`
                    : '';

                await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            {
                                type: 'execute',
                                stmt: {
                                    sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title, url, detail_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    args: [
                                        { type: 'text', value: String(result.title) },
                                        { type: 'text', value: String(result.aiSummary) },
                                        { type: 'text', value: item.source },
                                        { type: 'text', value: String(result.tag) },
                                        { type: 'text', value: String(result.tagColor) },
                                        { type: 'text', value: String(result.actionText) },
                                        { type: 'text', value: item.nlTitle },
                                        { type: 'text', value: item.url || '' },
                                        { type: 'text', value: String(result.detailContent || '') + linkHtml }
                                    ]
                                }
                            },
                            { type: 'close' }
                        ]
                    })
                });

                existingTitles.add(normNew); // 防止同一次 cron 内近似标题重复入库
                addedCount++;
            } catch (e) { console.error('解析/入库失败:', e); }
        }

        return res.status(200).json({ success: true, message: `精选入库 ${addedCount} 条华人视角新闻` });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
