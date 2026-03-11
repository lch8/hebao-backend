export const config = { runtime: 'edge' };

async function verifyJwt(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, sigB64] = parts;
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const sigStd = sigB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((sigB64.length + 2) % 4 || 4);
        const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(sigStd), c => c.charCodeAt(0)), new TextEncoder().encode(`${headerB64}.${payloadB64}`));
        if (!valid) return null;
        const payloadStd = payloadB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((payloadB64.length + 2) % 4 || 4);
        const payload = JSON.parse(atob(payloadStd));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload.userId;
    } catch { return null; }
}

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!authUserId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const { userId, authorName, title, text, imageUrl } = await req.json();
        if (!title || !text) return new Response(JSON.stringify({ error: '标题和做法不能为空哦！' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '环境变量未配置！' }), { status: 500 });
        dbUrl = dbUrl.replace('libsql://', 'https://');

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
                        { type: "text", value: String(authUserId) },
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
