// api/verify-auth-code.js
import { sql, ensureSchema, json } from './_delft-db.js';
export const config = { runtime: 'edge' };

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

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: '请求格式有误' }, 400); }
  const email = String(body?.email || '').trim().toLowerCase();
  const code = String(body?.code || '').trim();
  if (!email || !/^[0-9]{6}$/.test(code)) {
    return json({ error: '请填写有效的邮箱和 6 位数字验证码' }, 400);
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return json({ error: '登录配置缺失' }, 503);

    await ensureSchema();

    const codeRow = (await sql('SELECT code, expires_at, COALESCE(attempts, 0) AS attempts FROM verification_codes WHERE email = ?', [email])).rows[0];
    if (!codeRow) return json({ error: '验证码不存在或已失效，请重新获取' }, 400);

    if (new Date() > new Date(codeRow.expires_at)) {
      await sql('DELETE FROM verification_codes WHERE email = ?', [email]);
      return json({ error: '验证码已过期，请重新获取' }, 400);
    }

    if (String(codeRow.code) !== code) {
      const nextAttempts = Number(codeRow.attempts || 0) + 1;
      if (nextAttempts >= 5) {
        await sql('DELETE FROM verification_codes WHERE email = ?', [email]);
        return json({ error: '验证码连续输错次数过多，请重新获取验证码' }, 429);
      }
      await sql('UPDATE verification_codes SET attempts = ? WHERE email = ?', [nextAttempts, email]);
      return json({ error: '验证码错误，请核对后重试' }, 400);
    }

    // Match case-insensitively so legacy mixed-case emails seamlessly reuse their existing account.
    const existing = (await sql('SELECT id, deal_count FROM users WHERE lower(verified_email) = ? LIMIT 1', [email])).rows[0];
    let finalUserId;
    let isNewUser = true;
    let userDealCount = 0;

    if (existing) {
      finalUserId = String(existing.id);
      userDealCount = existing.deal_count != null ? Number(existing.deal_count) : 0;
      isNewUser = false;
    } else {
      finalUserId = crypto.randomUUID();
      await sql('INSERT INTO users (id, verified_email, email_verified, deal_count) VALUES (?, ?, 1, 0)', [finalUserId, email]);
    }
    await sql('DELETE FROM verification_codes WHERE email = ?', [email]);

    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt({ userId: finalUserId, email, iat: now, exp: now + 30 * 24 * 3600 }, jwtSecret);

    return json({
      success: true,
      token,
      isNewUser,
      deal_count: userDealCount,
      userId: finalUserId,
    });
  } catch (e) {
    console.error('verify-auth-code:', e);
    return json({ error: '验证暂时不可用，请稍后重试' }, 500);
  }
}
