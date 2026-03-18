export const config = { runtime: 'edge' };

export default async function handler(req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 抓取荷兰国内新闻源
        const rssRes = await fetch('https://feeds.nos.nl/nosnieuwsbinnenland');
        const xml = await rssRes.text();

        const items = [];
        const itemChunks = xml.split('<item>'); 
        
        for (let i = 1; i < itemChunks.length; i++) {
            if (items.length >= 5) break; // 每次最多看 5 条
            const chunk = itemChunks[i];
            let title = '', desc = '', link = '';
            
            if (chunk.includes('<title>') && chunk.includes('</title>')) title = chunk.split('<title>')[1].split('</title>')[0].replace('<![CDATA[', '').replace(']]>', '').trim();
            if (chunk.includes('<description>') && chunk.includes('</description>')) desc = chunk.split('<description>')[1].split('</description>')[0].replace('<![CDATA[', '').replace(']]>', '').replace(/<[^>]+>/g, '').trim(); 
            if (chunk.includes('<link>') && chunk.includes('</link>')) link = chunk.split('<link>')[1].split('</link>')[0].trim();
            
            if (title && desc) items.push({ nlTitle: title, nlDesc: desc, url: link });
        }

        let addedCount = 0;

        for (const item of items) {
            // 查重
            const checkRes = await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT id FROM pro_news WHERE dutch_title = ?", args: [{ type: "text", value: item.nlTitle }] } }, { type: "close" }] })
            });
            const checkData = await checkRes.json();
            if (checkData.results[0]?.response?.result?.rows?.length > 0) continue;

            // 🌟 神级 Prompt：加入 isRelevant 布尔值，做无情过滤！
            const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{
                        role: "system",
                        content: `你是荷兰华人留学生的情报过滤官。请判断以下新闻是否对中国留学生/华人【切身相关】（如：NS火车罢工/停运、IND签证政策、极端天气、退税、房租法案、校园新闻、荷兰重大超市打折、针对亚裔的安全警告）。
                        如果是政治内斗、地方市议会、体育比分、与华人无关的凶杀案，一律视为不相关！
                        必须输出 JSON：
                        {
                          "isRelevant": true或false,
                          "title": "中文吸睛标题(不超过20字)",
                          "aiSummary": "一句话中文省流总结",
                          "tag": "必须带Emoji的短标签",
                          "tagColor": "HEX颜色(#EF4444为紧急,#10B981为利好,#3B82F6为日常)",
                          "actionText": "不超过6字的建议动作(如: 提前出门/冲)"
                        }`
                    }, { role: "user", content: `标题: ${item.nlTitle}\n摘要: ${item.nlDesc}` }],
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiRes.json();
            if (!aiData.choices) continue;

            try {
                const result = JSON.parse(aiData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim());
                
                // 🛑 核心拦截：如果 AI 觉得跟留学生无关，直接跳过，绝对不存库！
                if (result.isRelevant !== true) {
                    console.log(`[过滤] 丢弃无聊新闻: ${item.nlTitle}`);
                    continue; 
                }
                
                await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            { type: "execute", stmt: { 
                                sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                                args: [
                                    { type: "text", value: String(result.title) }, { type: "text", value: String(result.aiSummary) },
                                    { type: "text", value: 'NOS.nl' }, { type: "text", value: String(result.tag) },
                                    { type: "text", value: String(result.tagColor) }, { type: "text", value: String(result.actionText) },
                                    { type: "text", value: String(item.nlTitle) }, { type: "text", value: String(item.url || '') } // 存入链接！
                                ] 
                            } },
                            { type: "close" }
                        ]
                    })
                });
                addedCount++;
            } catch (e) { console.error(e); }
        }

        return new Response(JSON.stringify({ success: true, message: `成功精选入库 ${addedCount} 条高价值新闻！` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
