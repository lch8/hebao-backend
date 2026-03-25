import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { targetId, userId, userName, userAvatar, userEmail, content } = req.body;
    const commentId = 'cmt_' + Date.now();

    try {
        await client.execute({
            sql: `INSERT INTO app_comments (id, target_id, user_id, user_name, user_avatar, user_email, content) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [commentId, targetId, userId, userName, userAvatar, userEmail, content]
        });
        res.status(200).json({ success: true, commentId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
