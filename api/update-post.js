// api/update-post.js
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
        const { postId, newContent } = await req.json();
        if (!postId || !newContent) return new Response(JSON.stringify({ error: '参数不全' }), { status: 400 });

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
                            sql: "UPDATE community_posts SET content = ? WHERE id = ? AND user_id = ?",
                            args: [
                                { type: "text", value: String(newContent) },
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

        return new Response(JSON.stringify({ success: true, message: '状态已更新' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}


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
