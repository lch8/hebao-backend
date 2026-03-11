// api/update-post.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { postId, userId, newContent } = await req.json();
        if (!postId || !userId || !newContent) return new Response(JSON.stringify({ error: '参数不全' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 仅允许帖子的创建者更新自己的帖子内容
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            sql: "UPDATE community_posts SET content = ? WHERE id = ? AND user_id = ?", 
                            args: [
                                { type: "text", value: String(newContent) },
                                { type: "integer", value: parseInt(postId) }, 
                                { type: "text", value: String(userId) }
                            ] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error(result.results[0].error.message);

        return new Response(JSON.stringify({ success: true, message: '状态已更新' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}
