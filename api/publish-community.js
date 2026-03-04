import { createClient } from '@libsql/client/web';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '只允许 POST' });

    try {
        const { userId, title, text, imageUrl } = req.body || {};

        if (!title || !text) {
            return res.status(400).json({ error: '标题和做法不能为空哦！' });
        }

        const dbUrl = process.env.TURSO_DATABASE_URL;
        const dbToken = process.env.TURSO_AUTH_TOKEN;

        // 🚨 终极防坑拦截器：直接把错的 URL 弹到你手机屏幕上！
        if (!dbUrl) {
            return res.status(500).json({ error: '🚨 找不到 TURSO_DATABASE_URL，它在 Vercel 里是空的！' });
        }
        if (dbUrl.includes('"') || dbUrl.includes("'")) {
            return res.status(500).json({ error: '🚨 URL里多写了双引号或单引号！请去 Vercel 删掉两边的引号！' });
        }
        if (!dbUrl.startsWith('libsql://') && !dbUrl.startsWith('https://')) {
            return res.status(500).json({ error: `🚨 URL格式不对！必须以 libsql:// 开头，现在读到的是: [${dbUrl}]` });
        }

        // 只有格式完全正确，才会执行连接
        const client = createClient({
            url: dbUrl,
            authToken: dbToken,
        });

        const randomName = '野生大厨' + Math.floor(Math.random() * 9999);

        await client.execute({
            sql: `INSERT INTO community_posts (user_id, author_name, title, content, image_url) VALUES (?, ?, ?, ?, ?)`,
            args: [userId || 'unknown-user', randomName, title, text, imageUrl || '']
        });

        return res.status(200).json({ success: true, message: '发布成功！' });

    } catch (error) {
        return res.status(500).json({ error: '底层报错: ' + error.message });
    }
}
