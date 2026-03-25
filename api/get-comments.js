import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    const { targetId } = req.query;

    try {
        // 按时间先后顺序拉取该卡片的所有评论
        const result = await client.execute({
            sql: `SELECT * FROM app_comments WHERE target_id = ? ORDER BY created_at ASC`,
            args: [targetId]
        });
        
        const comments = result.rows.map(row => ({
            id: row.id,
            targetId: row.target_id,
            userId: row.user_id,
            userName: row.user_name,
            userAvatar: row.user_avatar,
            userEmail: row.user_email,
            content: row.content,
            createdAt: row.created_at
        }));

        res.status(200).json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
