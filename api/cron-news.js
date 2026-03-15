import { createClient } from '@libsql/client';

export default async function handler(req, res) {
    try {
        console.log("🕷️ [Cron] 启动荷兰新闻自动抓取...");

        // ==========================================
        // 🌟 自动向下兼容变量名，绝不漏掉任何一个！
        // ==========================================
        const dbUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || process.env.DATABASE_URL;
        const dbToken = process.env.TURSO_AUTH_TOKEN;
        
        if (!dbUrl) {
            return res.status(500).json({ 
                success: false, 
                error: "环境变量缺失！请检查 Vercel 是否有名为 TURSO_DATABASE_URL 的变量，并且在配置后进行了 Redeploy！" 
            });
        }
        if (!dbUrl.startsWith('libsql://') && !dbUrl.startsWith('https://')) {
            return res.status(500).json({ success: false, error: `数据库链接格式错误，当前读到的是: ${dbUrl}` });
        }
        if (!process.env.DEEPSEEK_API_KEY) {
            return res.status(500).json({ success: false, error: "缺少 DEEPSEEK_API_KEY 环境变量！" });
        }
        // ==========================================

        const rssRes = await fetch('https://feeds.nos.nl/nosnieuwsalgemeen');
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

        // 初始化 Turso 数据库
        const db = createClient({ url: dbUrl, authToken: dbToken });
        let addedCount = 0;

        for (const item of items) {
            const checkExist = await db.execute({ sql: "SELECT id FROM pro_news WHERE dutch_title = ?", args: [item.nlTitle] });
            if (checkExist.rows.length > 0) continue;

            console.log(`🧠 [DeepSeek] 正在洗稿: ${item.nlTitle}`);

            const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{
                        role: "system",
                        content: `你是一个在荷兰生活多年的华人管家。请将以下荷兰语新闻翻译并提炼，严格输出 JSON 格式，绝不要包含 Markdown 代码块标记（如 \`\`\`json ）。\n必须包含以下字段：\n1. "title": 中文吸睛标题 (不超过25字)\n2. "aiSummary": 中文一句话省流总结\n3. "tag": 新闻分类标签 (必须带一个Emoji，如 '🚨 突发')\n4. "tagColor": 对应标签的 HEX 颜色 (突发为 #EF4444，资产为 #B45309，交通为 #3B82F6)\n5. "actionText": 给读者的建议动作 (不超过6个字)`
                    }, { role: "user", content: `荷兰语标题: ${item.nlTitle}\n荷兰语摘要: ${item.nlDesc}` }],
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiRes.json();
            if (!aiData.choices || !aiData.choices[0].message.content) continue;

            try {
                const result = JSON.parse(aiData.choices[0].message.content);
                await db.execute({
                    sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    args: [result.title, result.aiSummary, 'NOS.nl', result.tag, result.tagColor, result.actionText, item.nlTitle]
                });
                addedCount++;
            } catch (jsonErr) { console.error("JSON 解析失败:", jsonErr); }
        }

        res.status(200).json({ success: true, message: `成功同步并洗稿了 ${addedCount} 条新闻！` });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
