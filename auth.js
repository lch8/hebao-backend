// api/verify-auth-code.js
export const config = { runtime: 'edge' };

// ========== JWT 工具函数 (保持不变) ==========
function b64url(obj) { return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
async function signJwt(payload, secret) {
    const header = b64url({ alg: 'HS256', typ: 'JWT' });
    const body = b64url(payload);
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${data}.${sigB64}`;
}

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    try {
        const { email, code, userId } = await req.json();
        const dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;
        const jwtSecret = process.env.JWT_SECRET;

        // 1. 验证验证码 (增加报错检查)
        const vRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT code, expires_at FROM verification_codes WHERE email = ?", args: [{type:"text", value:email}] } }, { type: "close" }] })
        });
        const vData = await vRes.json();
        
        // 🚨 关键修复：检查 Turso 是否报错
        if (vData.results[0].type === 'error') throw new Error("数据库报错: " + vData.results[0].error.message);
        
        const vRows = vData.results[0].response.result.rows;
        if (!vRows || vRows.length === 0) throw new Error('验证码不存在，请重新获取');
        if (vRows[0][0].value !== code) throw new Error('验证码错误');
        if (new Date() > new Date(vRows[0][1].value)) throw new Error('验证码已过期');

        // 2. 检查老用户 (增加报错检查)
        const uRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT id FROM users WHERE verified_email = ?", args: [{type:"text", value:email}] } }, { type: "close" }] })
        });
        const uData = await uRes.json();
        if (uData.results[0].type === 'error') throw new Error("数据库查询用户报错: " + uData.results[0].error.message);

        const uRows = uData.results[0].response.result.rows;
        let finalUserId = (uRows && uRows.length > 0) ? uRows[0][0].value : userId;

        // 3. 写入用户并清理验证码
        const finalRequests = [];
        if (!uRows || uRows.length === 0) {
            finalRequests.push({ type: "execute", stmt: { sql: "INSERT INTO users (id, verified_email, email_verified) VALUES (?, ?, 1)", args: [{type:"text", value:finalUserId}, {type:"text", value:email}] } });
        }
        finalRequests.push({ type: "execute", stmt: { sql: "DELETE FROM verification_codes WHERE email = ?", args: [{type:"text", value:email}] } });
        finalRequests.push({ type: "close" });

        await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: finalRequests })
        });

        // 4. 签发 JWT
        const now = Math.floor(Date.now() / 1000);
        const token = await signJwt({ userId: finalUserId, email, iat: now, exp: now + 7 * 24 * 3600 }, jwtSecret);

        return new Response(JSON.stringify({ success: true, token }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
