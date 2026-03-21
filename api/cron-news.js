export const config = { 
    maxDuration: 60 // 🚀 成功申请 60 秒运行时间
};

// 💡 提取解析 RSS 的公共方法
const parseFeed = (xml, sourceName) => {
    const items = [];
    const itemChunks = xml.split('<item>'); 
    for (let i = 1; i < itemChunks.length; i++) {
        const chunk = itemChunks[i];
        let title = '', desc = '', link = '';
        if (chunk.includes('<title>') && chunk.includes('</title>')) title = chunk.split('<title>')[1].split('</title>')[0].replace('<![CDATA[', '').replace(']]>', '').trim();
        if (chunk.includes('<description>') && chunk.includes('</description>')) desc = chunk.split('<description>')[1].split('</description>')[0].replace('<![CDATA[', '').replace(']]>', '').replace(/<[^>]+>/g, '').trim(); 
        if (chunk.includes('<link>') && chunk.includes('</link>')) link = chunk.split('<link>')[1].split('</link>')[0].trim();
        if (title && desc) items.push({ nlTitle: title, nlDesc: desc, url: link, source: sourceName });
    }
    return items;
};

export default async function handler(req, res) {
    const authHeader = req.headers.authorization || req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 🌟 1. 同时抓取 NOS 和 NU.nl (NU.nl 更适合闲聊)
        const [nosRes, nuRes] = await Promise.all([
            fetch('https://feeds.nos.nl/nosnieuwsbinnenland').catch(() => ({text: () => ''})),
            fetch('https://www.nu.nl/rss/Algemeen').catch(() => ({text: () => ''}))
        ]);
        
        const nosItems = parseFeed(await nosRes.text(), 'NOS.nl');
        const nuItems = parseFeed(await nuRes.text(), 'NU.nl');
        
        // 交叉合并，NU.nl 的新闻放前面优先处理
        const combinedItems = [...nuItems.slice(0, 5), ...nosItems.slice(0, 5)];

        let addedCount = 0;

        // 🌟 2. 遍历新闻，寻找【未入库】且【适合破冰】的新闻，每次只处理 1 条
        for (const item of combinedItems) {
            if (addedCount >= 1) break; // 严格控制每小时只入库 1 条，节省 Token

            // 查重
            const checkRes = await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT id FROM pro_news WHERE dutch_title = ?", args: [{ type: "text", value: item.nlTitle }] } }, { type: "close" }] })
            });
            const checkData = await checkRes.json();
            if (checkData.results[0]?.response?.result?.rows?.length > 0) continue;

            // 🌟 3. 召唤 AI 主编 (强化 Small Talk 与进阶讨论)
            const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: `你是荷兰华人圈最资深的情报主编。你的任务是将荷兰语新闻转化为留学生爱看的“深度情报”与“破冰语料”。
                        【处理原则】：
                        1. 优先筛选适合跟荷兰人闲聊的“Small Talk”话题（如奇葩事件、恶劣天气、罢工、涨价）。坚决过滤沉闷政治。如果不适合闲聊，isRelevant填false。
                        2. 绝对不要逐句翻译！提取核心事实，并生成丰富的破冰语料。
                        
                        请严格输出以下 JSON 格式：
                        {
                          "isRelevant": true,
                          "title": "中文吸睛标题(不超过20字)",
                          "aiSummary": "一句话中文省流总结",
                          "tag": "带Emoji的短标签",
                          "tagColor": "HEX颜色(#EF4444紧, #10B981利, #F59E0B提, #3B82F6日)",
                          "actionText": "不超过6字的按钮文字",
                          "detailContent": "这里是深度编译的HTML格式内容。请务必严格使用以下结构：\\n<div style='margin-bottom:12px;'><b>📌 核心事件：</b><br>用两句话说明发生了什么大事。</div>\\n<div style='margin-bottom:12px;'><b>🔍 细节拆解：</b><br>• 要点1<br>• 要点2</div>\\n<div style='background:#FEF2F2; padding:12px; border-radius:8px; color:#991B1B; margin-bottom:12px;'><b>💡 管家解读：</b><br>分析此事对留学生的切身影响。</div>\\n<div style='background:#EFF6FF; padding:12px; border-radius:8px; color:#1E3A8A; border-left: 4px solid #3B82F6;'><b>☕️ 破冰金句 (Small Talk)：</b><br><span style='font-size:12px; color:#60A5FA;'>起手式：遇到荷兰人怎么顺口提这事儿？</span><br><br><b>🇬🇧 EN: </b>[填入英语起手句] <span onclick=\\"window.App.speak('[请填入英语起手句]', 'en-US')\\" style=\\"cursor:pointer; padding:2px 8px; background:#BFDBFE; color:#1E3A8A; border-radius:12px; font-size:11px; margin-left:6px; font-weight:bold;\\">🔊</span><br><br><b>🇳🇱 NL: </b>[填入荷兰语起手句] <span onclick=\\"window.App.speak('[请填入荷兰语起手句]', 'nl-NL')\\" style=\\"cursor:pointer; padding:2px 8px; background:#BFDBFE; color:#1E3A8A; border-radius:12px; font-size:11px; margin-left:6px; font-weight:bold;\\">🔊</span><br><br><span style='font-size:12px; color:#60A5FA;'>进阶讨论：如何接话或抛出观点？</span><br><br><b>🗣️ 进阶 1: </b>[填入一句荷兰语或英语讨论观点，附中文翻译] <span onclick=\\"window.App.speak('[请填入外语部分]', 'nl-NL')\\" style=\\"cursor:pointer; padding:2px 8px; background:#BFDBFE; color:#1E3A8A; border-radius:12px; font-size:11px; margin-left:6px; font-weight:bold;\\">🔊</span><br><br><b>🗣️ 进阶 2: </b>[填入第二句观点，附中文翻译] <span onclick=\\"window.App.speak('[请填入外语部分]', 'nl-NL')\\" style=\\"cursor:pointer; padding:2px 8px; background:#BFDBFE; color:#1E3A8A; border-radius:12px; font-size:11px; margin-left:6px; font-weight:bold;\\">🔊</span></div>"
                        }`
                        }, 
                        { 
                            role: "user", 
                            content: `标题: ${item.nlTitle}\n摘要: ${item.nlDesc}` 
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiRes.json();
            if (!aiData.choices) continue;

            try {
                const result = JSON.parse(aiData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim());
                if (result.isRelevant !== true) continue; 

                // 🌟 4. 暴力追加“查看原网页”按钮 (使用原生JS拼接，绝不出错)
                const linkHtml = `<div style="margin-top: 20px; text-align: center;"><a href="${item.url}" target="_blank" style="display: inline-block; padding: 10px 24px; background: #F1F5F9; color: #3B82F6; font-size: 13px; font-weight: bold; border-radius: 20px; text-decoration: none; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: 0.2s;">🔗 点击查看原新闻网页 ›</a></div>`;
                const finalDetailContent = String(result.detailContent || '') + linkHtml;
                
                await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            { type: "execute", stmt: { 
                                sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title, url, detail_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                                args: [
                                    { type: "text", value: String(result.title) }, 
                                    { type: "text", value: String(result.aiSummary) },
                                    { type: "text", value: item.source }, 
                                    { type: "text", value: String(result.tag) },
                                    { type: "text", value: String(result.tagColor) }, 
                                    { type: "text", value: String(result.actionText) },
                                    { type: "text", value: String(item.nlTitle) }, 
                                    { type: "text", value: String(item.url || '') }, 
                                    { type: "text", value: finalDetailContent } // 使用拼接好的内容
                                ] 
                            } },
                            { type: "close" }
                        ]
                    })
                });
                addedCount++;
            } catch (e) { console.error(e); }
        }

        return res.status(200).json({ success: true, message: `成功精选入库 ${addedCount} 条高价值新闻！` });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
