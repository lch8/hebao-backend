// api/cron-news.js
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
    // 💡 Vercel 防超时终极策略：每次只抓取处理最顶部的 1 到 2 条新新闻
    if (items.length >= 2) break; 
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
                    messages: [
                        {
                            role: "system",
                            content: `你是荷兰华人圈最资深的情报主编（类似荷乐网高级编辑）。
                        你的任务是将荷兰语新闻转化为中国留学生爱看的“深度情报”。
                        【处理原则】：
                        1. 坚决过滤纯国际政治、远方战争、体育比分等无关内容（遇到这类直接 isRelevant 填 false）。
                        2. 绝对不要逐句翻译！你要提取核心事实，并加入对留学生的“影响分析”以及“闲聊建议”。
                        
                        请严格输出以下 JSON 格式：
                        {
                          "isRelevant": true,
                          "title": "中文吸睛标题(不超过20字)",
                          "aiSummary": "一句话中文省流总结(用于列表展示)",
                          "tag": "带Emoji的短标签",
                          "tagColor": "HEX颜色(#EF4444紧急, #10B981利好, #F59E0B提醒, #3B82F6日常)",
                          "actionText": "不超过6字的按钮文字(如: 查看管家解读)",
                          "detailContent": "这里是深度编译的HTML格式内容。请务必使用以下结构排版：\\n<div style='margin-bottom:12px;'><b>📌 核心事件：</b><br>用两句话说明发生了什么大事。</div>\\n<div style='margin-bottom:12px;'><b>🔍 细节拆解：</b><br>• 要点1<br>• 要点2<br>• 要点3</div>\\n<div style='background:#FEF2F2; padding:12px; border-radius:8px; color:#991B1B; margin-bottom:12px;'><b>💡 管家解读：</b><br>用接地气的口吻，分析这件事对留学生的切身影响。</div>\\n<div style='background:#EFF6FF; padding:12px; border-radius:8px; color:#1E3A8A; border-left: 4px solid #3B82F6;'><b>☕️ 破冰金句 (Small Talk)：</b><br><span style='font-size:12px; color:#60A5FA;'>遇到荷兰人怎么顺口提这事儿？</span><br><br><b>🇬🇧 EN: </b>[这里写英语句子] <span onclick=\\"window.App.speak('[请把前面的英语句子完整填入这里]', 'en-US')\\" style=\\"cursor:pointer; padding:2px 8px; background:#BFDBFE; color:#1E3A8A; border-radius:12px; font-size:11px; margin-left:6px; font-weight:bold; box-shadow: 0 1px 2px rgba(0,0,0,0.05);\\">🔊 读出来</span><br><br><b>🇳🇱 NL: </b>[这里写荷兰语句子] <span onclick=\\"window.App.speak('[请把前面的荷兰语句子完整填入这里]', 'nl-NL')\\" style=\\"cursor:pointer; padding:2px 8px; background:#BFDBFE; color:#1E3A8A; border-radius:12px; font-size:11px; margin-left:6px; font-weight:bold; box-shadow: 0 1px 2px rgba(0,0,0,0.05);\\">🔊 读出来</span><br></div>"
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
                                // 🌟 语法已完美修复
                                sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title, url, detail_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                                args: [
                                    { type: "text", value: String(result.title) }, 
                                    { type: "text", value: String(result.aiSummary) },
                                    { type: "text", value: 'NOS.nl' }, 
                                    { type: "text", value: String(result.tag) },
                                    { type: "text", value: String(result.tagColor) }, 
                                    { type: "text", value: String(result.actionText) },
                                    { type: "text", value: String(item.nlTitle) }, 
                                    { type: "text", value: String(item.url || '') }, 
                                    { type: "text", value: String(result.detailContent || '') }
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
