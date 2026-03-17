// api/delete-post.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!authUserId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const { postId } = await req.json();
        if (!postId) return new Response(JSON.stringify({ error: '参数不全' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

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
                            sql: "DELETE FROM community_posts WHERE id = ? AND user_id = ?",
                            args: [
                                // 🌟 兜底转换：有些数据库的 ID 是字符串类型，这里为了不被拒绝，我们统统用 text
                                { type: "text", value: String(postId) },
                                { type: "text", value: String(authUserId) }
                            ]
                        }
                    },
                    { type: "close" }
                ]
            })
        });

        // 🌟 终极照妖镜：拦截 Turso 的直接拒绝
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Turso 拒绝连接 (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        
        // 🌟 防爆盾：防止 undefined 报错
        if (result.message || result.error) throw new Error(`Turso 报错: ${result.message || result.error}`);
        if (!result.results || !result.results[0]) throw new Error(`Turso 返回格式异常: ${JSON.stringify(result)}`);
        if (result.results[0].type === 'error') throw new Error(`Turso SQL 报错: ${result.results[0].error.message}`);

        return new Response(JSON.stringify({ success: true, message: '下架成功' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
