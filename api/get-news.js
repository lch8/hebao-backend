// api/get-news.js
import { createClient } from '@libsql/client';

export default async function handler(req, res) {
    try {
        const db = createClient({
            url: process.env.TURSO_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
        });

        // 取出最新的 5 条新闻
        const result = await db.execute(`
            SELECT * FROM pro_news 
            ORDER BY id DESC 
            LIMIT 5
        `);

        // 组装成前端 app.js 中 renderProNews 方法需要的格式
        const newsList = result.rows.map(row => {
            // 计算时间差 (如 "1小时前", "今天 10:30")
            const date = new Date(row.created_at + 'Z'); // Turso 存的是 UTC
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            return {
                time: `今天 ${timeStr}`, 
                tag: row.tag,
                tagColor: row.tag_color,
                title: row.title,
                aiSummary: row.ai_summary,
                source: row.source,
                actionText: row.action_text
            };
        });

        res.status(200).json({ success: true, news: newsList });

    } catch (error) {
        console.error("🚨 [API] 获取新闻失败:", error);
        res.status(500).json({ success: false, error: "Database Connection Failed" });
    }
}
