import { authId, json, sql } from './_delft-db.js';
import { storeImage, storageHealth } from './_image-store.js';
export const config = { runtime: 'edge' };

const MAX_BASE64 = 1200000; // ≈ 900 KB JPEG; the browser compresses well below this.

const quotaHit = async (key, limit) => {
  await sql('CREATE TABLE IF NOT EXISTS delft_upload_quota (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');
  const quota = await sql(`INSERT INTO delft_upload_quota(id,hits) VALUES(?,1)
     ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<? RETURNING hits`, [key, limit]);
  return quota.rows.length > 0;
};

const ipKey = async request => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`upload-check:${ip}:${process.env.JWT_SECRET || ''}`));
  return [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
};

export default async function handler(request) {
  const day = new Date().toISOString().slice(0, 10);
  if (request.method === 'GET') {
    // Storage self-check (no secrets returned): GET /api/delft-upload?check=1
    if (new URL(request.url).searchParams.get('check') !== '1') return json({ error: '不支持的方法' }, 405);
    try {
      const probe = await quotaHit(`check:${day}:${await ipKey(request)}`, 20).catch(() => false);
      return json(await storageHealth(process.env, { probe }));
    } catch (error) {
      console.error('storage check', error);
      return json({ error: '检查失败' }, 500);
    }
  }
  if (request.method !== 'POST') return json({ error: '不支持的方法' }, 405);
  const user = await authId(request);
  if (!user) return json({ error: '登录已过期，请重新登录', code: 'auth' }, 401);
  let imageBase64;
  try { ({ imageBase64 } = await request.json()); }
  catch { return json({ error: '照片数据有误，请重新选择照片', code: 'bad_request' }, 400); }
  if (typeof imageBase64 !== 'string' || imageBase64.length < 100 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64))
    return json({ error: '照片格式有误，请重新选择照片', code: 'bad_image' }, 400);
  if (imageBase64.length > MAX_BASE64)
    return json({ error: '照片太大（压缩后仍超过约 900KB），请换一张或截图后再传', code: 'too_large' }, 413);
  let bytes;
  try { bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0)); }
  catch { return json({ error: '照片格式有误，请重新选择照片', code: 'bad_image' }, 400); }
  // JPEG starts with FFD8FF; this API only accepts browser-compressed JPEGs.
  if (bytes.length < 128 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)
    return json({ error: '仅支持 JPG 照片，请重新选择', code: 'bad_image' }, 400);
  try {
    // Hard upload quota per verified user/day to limit storage abuse.
    if (!await quotaHit(`${day}:${user}`, 60)) return json({ error: '今天上传次数已达上限（60 张），请明天再试', code: 'quota' }, 429);
    const stored = await storeImage(user, imageBase64, bytes);
    return json({ ok: true, url: stored.url, storage: stored.storage });
  } catch (error) {
    console.error('delft upload', error?.code || '', error);
    return json({ error: '图片暂时无法上传，请稍后重试；也可以先不带照片发布', code: error?.code || 'storage' }, 503);
  }
}
