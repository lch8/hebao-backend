// api/send-auth-email.js
import { sql, ensureSchema, json } from './_delft-db.js';
export const config = { runtime: 'edge' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hashKey(raw) {
  const secret = process.env.JWT_SECRET || 'hebao-auth';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${raw}:${secret}`));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  try {
    let body;
    try { body = await req.json(); } catch { return json({ error: '请求格式有误' }, 400); }
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email || email.length > 120 || !EMAIL_RE.test(email)) {
      return json({ error: '请输入有效的邮箱地址' }, 400);
    }

    await ensureSchema();

    // 1. 55-second resend cooldown per email
    const existing = (await sql('SELECT created_at FROM verification_codes WHERE email=?', [email])).rows[0];
    if (existing?.created_at && Date.now() - Date.parse(existing.created_at) < 55000) {
      return json({ error: '验证码发送过于频繁，请稍后再试' }, 429);
    }

    // 2. Daily per-email (10) & per-IP (20) caps to protect Resend quota
    const day = new Date().toISOString().slice(0, 10);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const [emailKey, ipKey] = await Promise.all([
      hashKey(`otp-email:${day}:${email}`),
      hashKey(`otp-ip:${day}:${ip}`),
    ]);
    const emailQuota = await sql(
      'INSERT INTO auth_rate_limits(id,hits) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<10 RETURNING hits',
      [emailKey]
    );
    const ipQuota = await sql(
      'INSERT INTO auth_rate_limits(id,hits) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<20 RETURNING hits',
      [ipKey]
    );
    if (!emailQuota.rows.length || !ipQuota.rows.length) {
      return json({ error: '今日验证码发送次数已达上限，请明天再试' }, 429);
    }

    // 3. Cryptographically random 6-digit OTP
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const code = String(100000 + (rand[0] % 900000));
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

    await sql(
      'INSERT OR REPLACE INTO verification_codes (email, code, expires_at, created_at, attempts) VALUES (?, ?, ?, ?, 0)',
      [email, code, expiresAt, nowIso]
    );

    if (!process.env.RESEND_API_KEY) {
      return json({ error: '邮件服务暂未配置，请联系管理员' }, 503);
    }

    const from = process.env.RESEND_FROM_EMAIL || '荷包 <noreply@hebaogj.xyz>';
    const text = [
      `您的荷包登录验证码是：${code}`,
      '',
      '该验证码 10 分钟内有效，仅用于您本人在荷包网站的登录验证。',
      '如非本人操作，请直接忽略此邮件。',
      '',
      '—— 荷包 (hebaogj.xyz)'
    ].join('\n');

    const html = `<div style="font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #dfe6f0;border-radius:16px;background:#ffffff;color:#111e33">
      <div style="font-size:12px;letter-spacing:.04em;color:#617087;margin-bottom:6px">荷包 · 邮箱登录验证</div>
      <h2 style="margin:0 0 12px;font-size:20px;color:#14386e">您的登录验证码</h2>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#273852">请在登录窗口输入以下 6 位数字验证码完成验证：</p>
      <div style="background:#f3f6fb;border:1px solid #d8e3f2;border-radius:12px;padding:16px;font-size:28px;font-weight:700;text-align:center;letter-spacing:6px;color:#1c4b8f;font-variant-numeric:tabular-nums">${code}</div>
      <p style="color:#617087;font-size:12px;margin:18px 0 0;line-height:1.6">验证码 10 分钟内有效。如使用高校邮箱（如 @tudelft.nl）或 QQ/163 邮箱，可将发件人加入白名单以确保后续收到私信与报名提醒。如非本人操作，请忽略此邮件。</p>
    </div>`;

    const mailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from,
        to: email,
        subject: `荷包登录验证码：${code}`,
        text,
        html,
      }),
    });

    if (!mailRes.ok) {
      const mailData = await mailRes.json().catch(() => ({}));
      console.error('send-auth-email resend error:', mailRes.status, mailData);
      return json({ error: '邮件服务暂时繁忙，请稍后重试或检查邮箱拼写' }, 502);
    }

    return json({ success: true });
  } catch (e) {
    console.error('send-auth-email:', e);
    return json({ error: '验证码发送失败，请稍后重试' }, 500);
  }
}
