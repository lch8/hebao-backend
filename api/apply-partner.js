import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { postId, postTitle, hostId, applicantId, applicantName, applicantAvatar } = req.body;
    const appId = 'app_' + Date.now();

    try {
        await client.execute({
            sql: `INSERT INTO applications (id, post_id, post_title, host_id, applicant_id, applicant_name, applicant_avatar) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [appId, postId, postTitle, hostId, applicantId, applicantName, applicantAvatar]
        });
        res.status(200).json({ success: true, appId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
