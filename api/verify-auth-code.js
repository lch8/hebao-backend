// api/verify-auth-code.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    const { email, code, userId } = await req.json();
    let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
    const authToken = process.env.TURSO_AUTH_TOKEN;

    // 1. 检查验证码
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

    if (serverCode === code) {
        // 2. 更新用户认证状态
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
        return new Response(JSON.stringify({ success: true }));
    }
    return new Response(JSON.stringify({ error: '验证码错误或已过期' }), { status: 400 });
}
