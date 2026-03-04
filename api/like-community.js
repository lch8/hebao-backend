import { createClient } from '@libsql/client/web';



export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        const { postId } = await req.json();
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // 极其简单的 SQL，让对应帖子的点赞数 +1
        await client.execute({
            sql: `UPDATE community_posts SET likes = likes + 1 WHERE id = ?`,
            args: [postId]
        });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}
