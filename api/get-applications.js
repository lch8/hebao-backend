import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    const { userId } = req.query; // 这里的 userId 是当前登录的局长

    try {
        const result = await client.execute({
            sql: `SELECT * FROM applications WHERE host_id = ? AND status = 'pending' ORDER BY created_at DESC`,
            args: [userId]
        });
        
        // 将 snake_case 转换为前端需要的 camelCase
        const apps = result.rows.map(row => ({
            id: row.id,
            postId: row.post_id,
            postTitle: row.post_title,
            hostId: row.host_id,
            applicantId: row.applicant_id,
            applicantName: row.applicant_name,
            applicantAvatar: row.applicant_avatar,
            status: row.status
        }));

        res.status(200).json({ success: true, applications: apps });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
