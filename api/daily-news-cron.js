// Vercel Cron endpoint (daily at 06:00 UTC ≈ 07:00/08:00 Amsterdam time) to refresh Dutch news briefs.
import { ensureSchema, json } from './_delft-db.js';
import { generateDailyNews } from './_daily-news.js';
export const config = { runtime: 'edge' };

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }
  const secret = String(process.env.CRON_SECRET || '').trim();
  if (!secret) {
    return json({ error: 'CRON_SECRET 未配置' }, 503);
  }
  const provided = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!safeEqual(provided, secret)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    await ensureSchema();
    const force = new URL(request.url).searchParams.get('force') === '1';
    const result = await generateDailyNews({ force });
    return json({ ok: true, day: result.day, count: result.count, skipped: Boolean(result.skipped) });
  } catch (error) {
    console.error('daily-news-cron:', error);
    return json({ error: error.message || '每日简报生成失败' }, 500);
  }
}
