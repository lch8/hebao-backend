// api/get-posts.js
import { createClient } from '@libsql/client';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 获取前端想要拉取的帖子类型（比如 question, idle, help）
        const { type } = req.query;
        
        // 从 Turso 倒序查询最新的 50 条帖子
        const result = await db.execute({
            sql: 'SELECT * FROM posts WHERE type = ? ORDER BY created_at DESC LIMIT 50',
            args: [type || 'question']
        });

        // 返回给前端
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("拉取帖子失败:", error);
        res.status(500).json({ error: error.message });
    }
}
