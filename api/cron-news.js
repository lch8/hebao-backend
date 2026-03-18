export const config = { runtime: 'edge' };

export default async function handler(req) {
    // 防御校验：仅限 Vercel 触发器或授权管理员
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response(JSON.stringify({ error: '🚨 Unauthorized Cron Access' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        console.log("🕷️ [Cron] 启动荷兰新闻自动抓取...");

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        
        if (!dbUrl || !authToken) {
            return new Response(JSON.stringify({ success: false, error: "缺少 TURSO 环境变量！" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        dbUrl = dbUrl.replace('libsql://', 'https://');

        const rssRes = await fetch('https://feeds.nos.nl/nosnieuwsbinnenland');
        if (!rssRes.ok) throw new Error("RSS 源拉取失败, 状态码: " + rssRes.status);
        const xml = await rssRes.text();

        const items = [];
        const itemChunks = xml.split('<item>'); 
        
        for (let i = 1; i < itemChunks.length; i++) {
            if (items.length >= 2) break; 
            const chunk = itemChunks[i];
            let title = ''; let desc = '';
            
            if (chunk.includes('<title>') && chunk.includes('</title>')) {
                title = chunk.split('<title>')[1].split('</title>')[0].replace('<![CDATA[', '').replace(']]>', '').trim();
            }
            if (chunk.includes('<description>') && chunk.includes('</description>')) {
                desc = chunk.split('<description>')[1].split('</description>')[0].replace('<![CDATA[', '').replace(']]>', '').replace(/<[^>]+>/g, '').trim(); 
            }
            if (title && desc) items.push({ nlTitle: title, nlDesc: desc });
        }

        if (items.length === 0) throw new Error("RSS 解析为空");

        let addedCount = 0;

        for (const item of items) {
            // 查重验证
            const checkRes = await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        { type: "execute", stmt: { sql: "SELECT id FROM pro_news WHERE dutch_title = ?", args: [{ type: "text", value: item.nlTitle }] } },
                        { type: "close" }
                    ]
                })
            });
            const checkData = await checkRes.json();
            if (checkData.results[0]?.response?.result?.rows?.length > 0) continue;

            console.log(`🧠 [DeepSeek] 正在洗稿: ${item.nlTitle}`);

            const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{
                        role: "system",
                        content: `你是一个在荷兰生活多年的华人管家，专门为中国留学生提供实用情报。
请将以下荷兰语新闻翻译并提炼。
【过滤规则】：如果新闻是关于纯国际政治、他国战争、无关痛痒的政客吵架，请直接在所有字段填 "SKIP"（我们不收录）。
【改写风格】：用接地气、幽默、小红书式的口吻。比如“降雨”说成“妖风阵雨又来了”，“打折”说成“薅羊毛”。
严格输出 JSON：
1. "title": 吸睛标题 (如：🚨 NS又作妖了！周末火车停运)
2. "aiSummary": 一句话省流总结，说明对留学生有什么影响。
3. "tag": 简短标签 (如：出行避雷、签证政策、超市羊毛)，必须带Emoji。
4. "tagColor": HEX颜色 (严重的用#EF4444，羊毛用#10B981)。
5. "actionText": 建议动作 (如：赶紧改签、冲！)。绝不要输出 Markdown 标记。`
                    }, { role: "user", content: `荷兰语标题: ${item.nlTitle}\n荷兰语摘要: ${item.nlDesc}` }],
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiRes.json();
            if (!aiData.choices || !aiData.choices[0].message.content) continue;

            try {
                let aiText = aiData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(aiText);
                
                await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            { type: "execute", stmt: { 
                                sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                                args: [
                                    { type: "text", value: String(result.title) },
                                    { type: "text", value: String(result.aiSummary) },
                                    { type: "text", value: 'NOS.nl' },
                                    { type: "text", value: String(result.tag) },
                                    { type: "text", value: String(result.tagColor) },
                                    { type: "text", value: String(result.actionText) },
                                    { type: "text", value: String(item.nlTitle) }
                                ] 
                            } },
                            { type: "close" }
                        ]
                    })
                });
                addedCount++;
            } catch (jsonErr) { console.error("JSON 解析或写入失败:", jsonErr); }
        }

        return new Response(JSON.stringify({ success: true, message: `成功同步并洗稿了 ${addedCount} 条新闻！` }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
