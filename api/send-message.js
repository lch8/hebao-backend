import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    
    try {
        const { senderId, receiverId, postId, content } = await req.json();
        if (!senderId || !receiverId || !content) return new Response(JSON.stringify({ error: '参数不全' }), { status: 400 });

        // 防御：如果是登录用户，强制校验发送者必须是本人
        if (authUserId && authUserId !== senderId) {
            return new Response(JSON.stringify({ error: '非法发送者' }), { status: 403 });
        }

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            sql: "INSERT INTO messages (sender_id, receiver_id, post_id, content) VALUES (?, ?, ?, ?)", 
                            args: [
                                { type: "text", value: String(senderId) },
                                { type: "text", value: String(receiverId) },
                                { type: "text", value: String(postId || '') },
                                { type: "text", value: String(content) }
                            ] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error(result.results[0].error.message);

        return new Response(JSON.stringify({ success: true, message: '发送成功' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}
