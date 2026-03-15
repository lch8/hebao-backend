import { verifyJwt } from './_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    const token = req.headers.get('Authorization')?.slice(7);
    const userId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!userId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const { dutch_name, action } = await req.json();

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken || !dutch_name || !action) {
            return new Response(JSON.stringify({ error: '参数缺失或无数据库钥匙' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        if (action !== 'like' && action !== 'dislike') {
            return new Response(JSON.stringify({ error: '非法的 action 参数' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');
        let sql = action === 'like' 
            ? 'UPDATE products SET likes = COALESCE(likes, 0) + 1 WHERE dutch_name = ?'
            : 'UPDATE products SET dislikes = COALESCE(dislikes, 0) + 1 WHERE dutch_name = ?';

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sql, args: [{ type: "text", value: String(dutch_name) }] } },
                    { type: "close" }
                ]
            })
        });

        if (!response.ok) throw new Error("Turso 计分失败");

        return new Response(JSON.stringify({ success: true, message: '投票成功！' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
