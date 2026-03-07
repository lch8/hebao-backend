export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        // 🚨 新增：接收前端传来的 authorName
        const { userId, authorName, title, text, imageUrl } = await req.json();
        if (!title || !text) return new Response(JSON.stringify({ error: '标题和做法不能为空哦！' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '环境变量未配置！' }), { status: 500 });
        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 🚨 核心：如果有名字就用名字，没有就随机分配
        const finalName = authorName && authorName.trim() !== '' 
            ? authorName.trim() 
            : '野生大厨' + Math.floor(Math.random() * 9999);
            
        const sql = `INSERT INTO community_posts (user_id, author_name, title, content, image_url) VALUES (?, ?, ?, ?, ?)`;
        
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sql, args: [
                        { type: "text", value: String(userId || 'unknown') },
                        { type: "text", value: String(finalName) },
                        { type: "text", value: String(title) },
                        { type: "text", value: String(text) },
                        { type: "text", value: String(imageUrl || '') }
                    ]}},
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error("Turso数据库拒收: " + result.results[0].error.message);

        return new Response(JSON.stringify({ success: true, message: '发布成功！' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
}
