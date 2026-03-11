// api/verify-auth-code.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    const { email, code, userId } = await req.json();

    let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
    const authToken = process.env.TURSO_AUTH_TOKEN;

    try {
        // 1. 从数据库读取并检查是否过期
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

        if (serverCode && serverCode === code) {
            // 2. 校验成功，更新用户认证状态并删除验证码记录
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
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
        } else {
            return new Response(JSON.stringify({ error: '验证码错误或已过期' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
