import { verifyJwt } from './_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });

    // 🛡️ 强制登录校验 (必须是真实的荷包蛋才能点评)
    const token = req.headers.get('Authorization')?.slice(7);
    const userId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!userId) return new Response(JSON.stringify({ error: '请先登录后再发表真实评价哦！' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });

    try {
        const { dutch_name, content, author, avatar } = await req.json();

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken || !dutch_name || !content) {
            return new Response(JSON.stringify({ error: '参数缺失或无数据库钥匙' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 将真实评价写入刚才建好的 reviews 表
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            sql: "INSERT INTO reviews (dutch_name, user_id, author, avatar, content) VALUES (?, ?, ?, ?, ?)", 
                            args: [
                                { type: "text", value: String(dutch_name) },
                                { type: "text", value: String(userId) },
                                { type: "text", value: String(author || '匿名荷包蛋') },
                                { type: "text", value: String(avatar || '😎') },
                                { type: "text", value: String(content) }
                            ] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        if (!response.ok) throw new Error("Turso 写入评论失败");

        return new Response(JSON.stringify({ success: true, message: '评价发布成功！' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
