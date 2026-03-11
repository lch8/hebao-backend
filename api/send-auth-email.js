// api/send-auth-email.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { email } = await req.json();
        // 1. 生成 6 位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10分钟有效

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 2. 写入数据库验证码表
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

        // 3. 调用 Resend API 发送邮件
        // 注意：如果你没有在 Resend 绑定自己的域名，测试阶段只能发给 Resend 注册时的那个邮箱（或者是使用 resend.dev 的代发域名）
        const mailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                from: '荷包管家 <onboarding@resend.dev>', 
                to: email,
                subject: '【荷包管家】您的身份验证码',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #EEE; border-radius: 10px;">
                        <h2 style="color: #10B981;">🎓 身份认证申请</h2>
                        <p>您正在尝试认证荷包管家校友身份，您的验证码是：</p>
                        <div style="background: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #111827;">
                            ${code}
                        </div>
                        <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>
                    </div>
                `
            })
        });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
