// api/cron-news.js
import { createClient } from '@libsql/client';

export default async function handler(req, res) {
    try {
        console.log("🕷️ [Cron] 启动荷兰新闻自动抓取...");

        // 1. 抓取荷兰国家新闻台 (NOS) 的 RSS
        const rssRes = await fetch('https://feeds.nos.nl/nosnieuwsalgemeen');
        if (!rssRes.ok) throw new Error("RSS 源拉取失败, HTTP 状态码: " + rssRes.status);
        const xml = await rssRes.text();

        // 2. 🛡️ 兼容性极强的原生正则解析引擎 (同时支持带/不带 CDATA 的 XML)
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
        const descRegex = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/;

        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < 2) {
            const itemXml = match[1];
            const titleMatch = titleRegex.exec(itemXml);
            const descMatch = descRegex.exec(itemXml);
            
            if (titleMatch && descMatch) {
                items.push({ 
                    nlTitle: titleMatch[1].trim(), 
                    nlDesc: descMatch[1].replace(/<[^>]+>/g, '').trim() // 剥离多余的 HTML 标签
                });
            }
        }

        if (items.length === 0) {
            console.error("抓取到的 XML 片段:", xml.substring(0, 300));
            throw new Error("RSS 解析为空");
        }

        // 3. 初始化 Turso 数据库
        const db = createClient({
            url: process.env.TURSO_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
        });

        let addedCount = 0;

        // 4. 逐条交给 DeepSeek 洗稿并入库
        for (const item of items) {
            // 查重：如果数据库已有这篇新闻的荷兰语原标题，则跳过
            const checkExist = await db.execute({ sql: "SELECT id FROM pro_news WHERE dutch_title = ?", args: [item.nlTitle] });
            if (checkExist.rows.length > 0) continue;

            console.log(`🧠 [DeepSeek] 正在洗稿: ${item.nlTitle}`);

            // 唤起 DeepSeek，严格约束 JSON 输出
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
                        content: `你是一个在荷兰生活多年的华人管家。请将以下荷兰语新闻翻译并提炼，严格输出 JSON 格式，绝不要包含 Markdown 代码块标记（如 \`\`\`json ）。\n必须包含以下字段：\n1. "title": 中文吸睛标题 (不超过25字)\n2. "aiSummary": 中文一句话省流总结 (包含重点数据/影响，语气要像贴心管家)\n3. "tag": 新闻分类标签 (必须带一个Emoji，如 '🚨 突发', '📈 资产', '🚆 交通', '🌦️ 天气')\n4. "tagColor": 对应标签的 HEX 颜色 (突发为 #EF4444，资产为 #B45309，交通为 #3B82F6，政策为 #6366F1)\n5. "actionText": 给读者的建议动作 (不超过6个字，如 '去屯粮', '查免税额', '看火车班次')`
                    }, {
                        role: "user",
                        content: `荷兰语标题: ${item.nlTitle}\n荷兰语摘要: ${item.nlDesc}`
                    }],
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiRes.json();
            if (!aiData.choices || !aiData.choices[0].message.content) {
                console.error("DeepSeek 返回异常:", aiData);
                continue;
            }

            // 5. 解析 JSON 并写入数据库
            try {
                const result = JSON.parse(aiData.choices[0].message.content);
                await db.execute({
                    sql: `INSERT INTO pro_news (title, ai_summary, source, tag, tag_color, action_text, dutch_title) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    args: [result.title, result.aiSummary, 'NOS.nl', result.tag, result.tagColor, result.actionText, item.nlTitle]
                });
                addedCount++;
            } catch (jsonErr) {
                console.error("JSON 解析或入库失败:", jsonErr);
            }
        }

        res.status(200).json({ success: true, message: `成功同步并由 DeepSeek 洗稿了 ${addedCount} 条新闻！` });

    } catch (error) {
        console.error("🚨 [Cron News] 爬虫执行失败:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
