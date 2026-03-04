export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { userId, title, text, imageUrl } = await req.json();
        if (!title || !text) return new Response(JSON.stringify({ error: '标题和做法不能为空哦！' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '环境变量未配置！' }), { status: 500 });
        // 将 libsql 协议替换为 https 协议以便 fetch 调用
        dbUrl = dbUrl.replace('libsql://', 'https://');

        const randomName = '野生大厨' + Math.floor(Math.random() * 9999);
        const sql = `INSERT INTO community_posts (user_id, author_name, title, content, image_url) VALUES (?, ?, ?, ?, ?)`;
        
        // 使用纯净的原生 fetch 直接打给 Turso 数据库底层 API
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sql, args: [
                        { type: "text", value: String(userId || 'unknown') },
                        { type: "text", value: String(randomName) },
                        { type: "text", value: String(title) },
                        { type: "text", value: String(text) },
                        { type: "text", value: String(imageUrl || '') }
                    ]}},
                    { type: "close" }
                ]
            })
        });

        if (!response.ok) throw new Error("数据库写入拒绝");

        return new Response(JSON.stringify({ success: true, message: '发布成功！' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
