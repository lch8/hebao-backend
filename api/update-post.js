// api/update-post.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    // 1. 严格保安：JWT 鉴权
    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!authUserId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const { postId, content } = await req.json();
        if (!postId || !content) return new Response(JSON.stringify({ error: '参数不全' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 2. 更新数据库：只允许作者修改自己的帖子！
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
                                { type: "text", value: String(content) },
                                { type: "integer", value: parseInt(postId) },
                                { type: "text", value: String(authUserId) }
                            ]
                        }
                    },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error(result.results[0].error.message);

        return new Response(JSON.stringify({ success: true, message: '更新成功' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
