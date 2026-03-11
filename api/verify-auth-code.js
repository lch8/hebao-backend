// api/verify-auth-code.js
export const config = { runtime: 'edge' };

// ========== JWT 工具函数（使用 Web Crypto API，Edge 原生支持）==========
function b64url(obj) {
    return btoa(JSON.stringify(obj))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signJwt(payload, secret) {
    const header = b64url({ alg: 'HS256', typ: 'JWT' });
    const body = b64url(payload);
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${data}.${sigB64}`;
}
// =====================================================================

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});

    const { email, code, userId } = await req.json();
    if (!email || !code || !userId) {
        return new Response(JSON.stringify({ error: '参数不完整' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return new Response(JSON.stringify({ error: '服务器未配置 JWT_SECRET' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }

    let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
    const authToken = process.env.TURSO_AUTH_TOKEN;

    try {
        // 1. 从数据库读取并检查验证码是否过期
        const checkRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "SELECT code FROM verification_codes WHERE email = ? AND expires_at > CURRENT_TIMESTAMP", args: [{type:"text", value:email}] } },
                    { type: "close" }
                ]
            })
        });
        const checkData = await checkRes.json();
        const serverCode = checkData.results[0].response.result.rows[0]?.[0]?.value;

        if (!serverCode || serverCode !== code) {
            return new Response(JSON.stringify({ error: '验证码错误或已过期' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
        }

        // 2. 校验成功：更新用户认证状态 + 删除验证码记录
        await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "UPDATE users SET email_verified = 1, verified_email = ? WHERE id = ?", args: [{type:"text", value:email}, {type:"text", value:userId}] } },
                    { type: "execute", stmt: { sql: "DELETE FROM verification_codes WHERE email = ?", args: [{type:"text", value:email}] } },
                    { type: "close" }
                ]
            })
        });

        // 3. 生成 JWT（7天有效期）
        const now = Math.floor(Date.now() / 1000);
        const token = await signJwt(
            { userId, email, iat: now, exp: now + 7 * 24 * 3600 },
            jwtSecret
        );

        return new Response(JSON.stringify({ success: true, token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
