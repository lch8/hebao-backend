// api/verify-auth-code.js
export const config = { runtime: 'edge' };

// ========== JWT 工具函数 ==========
function b64url(obj) {
    return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signJwt(payload, secret) {
    const header = b64url({ alg: 'HS256', typ: 'JWT' });
    const body = b64url(payload);
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${data}.${sigB64}`;
}
// ===================================

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});

    const { email, code, userId } = await req.json(); 
    if (!email || !code || !userId) {
        return new Response(JSON.stringify({ error: '参数不全' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;
        const jwtSecret = process.env.JWT_SECRET;

        // 1. 验证 Code 是否正确且未过期
        const verifyRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "SELECT code, expires_at FROM verification_codes WHERE email = ?", args: [{type:"text", value:email}] } },
                    { type: "close" }
                ]
            })
        });
        const verifyData = await verifyRes.json();
        const rows = verifyData.results[0].response.result.rows;

        if (!rows || rows.length === 0) throw new Error('验证码不存在');
        const dbCode = rows[0][0].value;
        const dbExpiresAt = rows[0][1].value;

        if (dbCode !== code) throw new Error('验证码错误');
        if (new Date() > new Date(dbExpiresAt)) throw new Error('验证码已过期');

        // 🌟 2. 核心修改：连带查询用户的信用分 (credit)
        const userCheckRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "SELECT id, credit FROM users WHERE verified_email = ?", args: [{type:"text", value:email}] } },
                    { type: "close" }
                ]
            })
        });
        const userCheckData = await userCheckRes.json();
        const userRows = userCheckData.results[0].response.result.rows;

        let finalUserId = userId; 
        let isNewUser = true;
        let userCredit = 100; // 默认信用分

        if (userRows && userRows.length > 0) {
            // 老用户回归！
            finalUserId = userRows[0][0].value; 
            // 如果数据库查出来有分数就用，没有就给默认100
            userCredit = userRows[0][1].value !== null ? parseInt(userRows[0][1].value) : 100; 
            isNewUser = false;
        }

        // 3. 注册新用户，并销毁验证码
        const sqlRequests = [];
        if (isNewUser) {
            // 新用户默认给100分
            sqlRequests.push({ type: "execute", stmt: { sql: "INSERT INTO users (id, verified_email, email_verified, credit) VALUES (?, ?, 1, 100)", args: [{type:"text", value:finalUserId}, {type:"text", value:email}] } });
        }
        sqlRequests.push({ type: "execute", stmt: { sql: "DELETE FROM verification_codes WHERE email = ?", args: [{type:"text", value:email}] } });
        sqlRequests.push({ type: "close" });

        await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: sqlRequests })
        });

        const now = Math.floor(Date.now() / 1000);
        const token = await signJwt({ userId: finalUserId, email, iat: now, exp: now + 7 * 24 * 3600 }, jwtSecret);

        // 🌟 核心修复：必须把数据库里真正的 finalUserId 返回给前端，覆盖前端的临时 ID！
        return new Response(JSON.stringify({ 
            success: true, 
            token: token, 
            isNewUser: isNewUser, 
            credit: userCredit,
            userId: finalUserId // 👈 新增这一行！
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
