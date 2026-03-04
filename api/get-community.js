import { createClient } from '@libsql/client/web';


export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // 按时间倒序，拉取最新的 50 条食堂帖子
        const result = await client.execute(`
            SELECT id, author_name, image_url, title, content, likes, created_at 
            FROM community_posts 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        // 格式化数据
        const posts = result.rows.map(row => ({
            id: row.id,
            author_name: row.author_name,
            image_url: row.image_url,
            title: row.title,
            content: row.content,
            likes: row.likes,
            created_at: row.created_at
        }));

        return new Response(JSON.stringify({ success: true, posts }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Fetch Community Error:', error);
        return new Response(JSON.stringify({ error: '拉取社区数据失败' }), { 
            status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
