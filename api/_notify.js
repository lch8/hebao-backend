// Transactional email notifications via Resend (messages, RSVPs, event updates/cancellations).
import { sql } from './_delft-db.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export function siteOrigin() {
  const raw = String(process.env.PUBLIC_SITE_ORIGIN || 'https://hebaogj.xyz').trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(raw) ? raw : 'https://hebaogj.xyz';
}

async function canSendNotification(dedupeKey, cooldownMs) {
  if (!dedupeKey) return true;
  const now = Date.now();
  const row = (await sql('SELECT sent_at FROM delft_notify_log WHERE dedupe_key=?', [dedupeKey])).rows[0];
  if (row?.sent_at && cooldownMs > 0 && now - Date.parse(row.sent_at) < cooldownMs) {
    return false;
  }
  const iso = new Date(now).toISOString();
  await sql(
    'INSERT INTO delft_notify_log(dedupe_key,sent_at) VALUES(?,?) ON CONFLICT(dedupe_key) DO UPDATE SET sent_at=excluded.sent_at',
    [dedupeKey, iso]
  );
  return true;
}

export async function lookupUserEmail(userId) {
  if (!userId) return '';
  const row = (await sql('SELECT verified_email FROM users WHERE id=?', [userId])).rows[0];
  const email = String(row?.verified_email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export async function sendTransactionalEmail({
  toEmail,
  toUserId,
  dedupeKey = '',
  cooldownMs = 0,
  subject,
  heading,
  lines = [],
  ctaLabel = '打开荷包查看',
  ctaPath = '/mine',
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { skipped: true, reason: 'no_api_key' };
    const email = toEmail || (await lookupUserEmail(toUserId));
    if (!email) return { skipped: true, reason: 'no_recipient_email' };
    if (!(await canSendNotification(dedupeKey, cooldownMs))) {
      return { skipped: true, reason: 'cooldown' };
    }
    const origin = siteOrigin();
    const actionUrl = ctaPath.startsWith('http') ? ctaPath : `${origin}${ctaPath.startsWith('/') ? '' : '/'}${ctaPath}`;
    const from = process.env.RESEND_FROM_EMAIL || '荷包 <noreply@hebaogj.xyz>';
    const cleanSubject = String(subject || '荷包新消息提醒').replace(/[\r\n]+/g, ' ').slice(0, 120);
    const bodyLines = lines.filter(Boolean).map(l => String(l));
    const text = [
      heading || cleanSubject,
      '',
      ...bodyLines,
      '',
      `${ctaLabel}：${actionUrl}`,
      '',
      '—— 荷包 · 在荷同城、闲置与荷兰语备考',
      '此邮件为站内互动即时提醒，请勿在未核实物品前提前转账。'
    ].join('\n');

    const html = `<div style="font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #dfe6f0;border-radius:16px;background:#ffffff;color:#111e33;line-height:1.65">
      <div style="font-size:12px;letter-spacing:.04em;color:#617087;margin-bottom:8px">荷包 · 站内动态提醒</div>
      <h2 style="font-size:19px;margin:0 0 14px;color:#14386e">${esc(heading || cleanSubject)}</h2>
      ${bodyLines.map(line => `<p style="margin:0 0 10px;font-size:14px;color:#273852;white-space:pre-line">${esc(line)}</p>`).join('')}
      <div style="margin:20px 0 16px">
        <a href="${esc(actionUrl)}" style="display:inline-block;background:#1c4b8f;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:10px;font-size:14px;font-weight:600">${esc(ctaLabel)}</a>
      </div>
      <p style="margin:16px 0 0;padding-top:12px;border-top:1px solid #edf1f7;font-size:12px;color:#617087">如按钮无法点击，请复制此链接到浏览器打开：<br><a href="${esc(actionUrl)}" style="color:#1c4b8f;word-break:break-all">${esc(actionUrl)}</a></p>
    </div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ from, to: email, subject: cleanSubject, text, html }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Resend notification failed:', response.status, detail);
      return { ok: false, status: response.status };
    }
    return { ok: true };
  } catch (error) {
    console.error('Notification error:', error);
    return { ok: false };
  }
}

export async function notifyEventAttendees(eventId, payloadBuilder) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const rows = (await sql(
      `SELECT r.user_id, r.nickname, u.verified_email
       FROM delft_rsvps r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = ?`,
      [eventId]
    )).rows;
    await Promise.allSettled(rows.map(row => {
      const email = String(row.verified_email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Promise.resolve();
      return sendTransactionalEmail({ toEmail: email, ...payloadBuilder(row) });
    }));
  } catch (error) {
    console.error('Notify attendees error:', error);
  }
}
