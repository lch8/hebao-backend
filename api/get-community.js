import { createClient } from '@libsql/client/web';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        const result = await client.execute(`
            SELECT id, author_name, image_url, title, content, likes, created_at 
            FROM community_posts 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        const posts = result.rows.map(row => ({
            id: row.id,
            author_name: row.author_name,
            image_url: row.image_url,
            title: row.title,
            content: row.content,
            likes: row.likes,
            created_at: row.created_at
        }));

        // 🚨 核心修复
        return res.status(200).json({ success: true, posts });

    } catch (error) {
        console.error('Fetch Community Error:', error);
        return res.status(500).json({ error: '拉取社区数据失败' });
    }
}
