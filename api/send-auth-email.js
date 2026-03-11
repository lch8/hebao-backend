// api/send-auth-email.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { email } = await req.json();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10分钟有效

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 1. 存入数据库
        await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)", args: [{type:"text", value:email}, {type:"text", value:code}, {type:"text", value:expiresAt}] } },
                    { type: "close" }
                ]
            })
        });

        // 2. 调用 Resend 发送真实邮件
        const mailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: '荷包管家 <auth@yourdomain.com>', // 需要在Resend验证你的域名
                to: email,
                subject: '【荷包管家】您的身份认证验证码',
                html: `<p>您的验证码是 <strong>${code}</strong>，有效期10分钟。如非本人操作请忽略。</p>`
            })
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
