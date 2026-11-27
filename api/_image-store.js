// Image storage for listing photos.
// Primary: Tencent COS (COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION).
// Fallback: Turso (`delft_images` table, served by /api/delft-image) so publishing never
// blocks when COS is missing, misconfigured, deleted or unreachable from Vercel.
import { sql } from './_delft-db.js';

const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha1 = async text => hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text)));
const hmac = async (key, text) => {
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(text)));
};

export const DB_IMAGE_PATH = '/api/delft-image?id=';
export const dbImageUrl = id => `${DB_IMAGE_PATH}${id}`;
export const isDbImageUrl = value => /^\/api\/delft-image\?id=[0-9a-f-]{36}$/.test(String(value || ''));
export const isCosUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && /\.myqcloud\.com$/.test(url.hostname); }
  catch { return false; }
};

/**
 * Reads COS env vars defensively: trims stray whitespace/newlines pasted into Vercel and
 * accepts a full bucket domain or URL in COS_BUCKET (region is derived from it when possible).
 */
export function cosConfig(env = process.env) {
  const clean = value => String(value ?? '').trim().replace(/^['"]|['"]$/g, '').trim();
  const id = clean(env.COS_SECRET_ID), secret = clean(env.COS_SECRET_KEY);
  let bucket = clean(env.COS_BUCKET).replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  let region = clean(env.COS_REGION).toLowerCase();
  const fromHost = bucket.match(/^([a-z0-9-]+)\.cos\.([a-z0-9-]+)\.myqcloud\.com$/i);
  if (fromHost) { bucket = fromHost[1]; region = region || fromHost[2].toLowerCase(); }
  const missing = [['COS_SECRET_ID', id], ['COS_SECRET_KEY', secret], ['COS_BUCKET', bucket], ['COS_REGION', region]]
    .filter(([, v]) => !v).map(([k]) => k);
  const problems = [];
  if (bucket && !/^[a-z0-9][a-z0-9-]*-\d{6,}$/.test(bucket)) problems.push('COS_BUCKET 应为「存储桶名-APPID」格式，例如 hebao-1250000000');
  if (region && !/^[a-z]{2,}-[a-z]+(-\d+)?$/.test(region)) problems.push('COS_REGION 应为地域代码，例如 eu-frankfurt 或 ap-guangzhou');
  return {
    id, secret, bucket, region, missing, problems,
    configured: !missing.length,
    valid: !missing.length && !problems.length,
    host: bucket && region ? `${bucket}.cos.${region}.myqcloud.com` : '',
  };
}

const cosReasons = {
  NoSuchBucket: '存储桶不存在：请核对 COS_BUCKET / COS_REGION，或确认存储桶未被删除、账号未欠费',
  SignatureDoesNotMatch: 'COS_SECRET_KEY 与 COS_SECRET_ID 不匹配',
  InvalidAccessKeyId: 'COS_SECRET_ID 无效或已被禁用',
  AccessDenied: '密钥没有该存储桶的写入（PutObject）权限，或存储桶被封禁/欠费',
  RequestTimeTooSkewed: '服务器时间偏差过大',
  timeout: '连接腾讯云 COS 超时（Vercel 到该地域网络不稳定，建议使用 eu-frankfurt 等海外地域）',
  network: '无法连接腾讯云 COS（域名或网络错误）',
  missing: '未配置 COS 环境变量',
  config: 'COS 环境变量格式有误',
  cooldown: 'COS 最近上传失败，暂时改用数据库存储',
};
export const cosReason = code => cosReasons[code] || `腾讯云 COS 返回错误 ${code}`;

class CosError extends Error {
  constructor(code, status = 0) { super(cosReason(code)); this.code = code; this.status = status; }
}

/** Signed PUT to COS (XML API, q-sign-algorithm=sha1). Throws CosError with a COS error code. */
export async function cosPut(cfg, path, bytes, contentType = 'image/jpeg', timeoutMs = 7000) {
  const now = Math.floor(Date.now() / 1000), keyTime = `${now - 60};${now + 600}`;
  const signKey = await hmac(cfg.secret, keyTime);
  const headers = `content-type=${encodeURIComponent(contentType)}&host=${encodeURIComponent(cfg.host)}`;
  const reqHash = await sha1(`put\n${path}\n\n${headers}\n`);
  const signature = await hmac(signKey, `sha1\n${keyTime}\n${reqHash}\n`);
  const authorization = `q-sign-algorithm=sha1&q-ak=${cfg.id}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=content-type;host&q-url-param-list=&q-signature=${signature}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    // No manual Host header: fetch derives it from the URL (some runtimes reject or mangle an explicit Host).
    response = await fetch(`https://${cfg.host}${path}`, {
      method: 'PUT', headers: { 'Content-Type': contentType, Authorization: authorization }, body: bytes, signal: controller.signal,
    });
  } catch (error) {
    throw new CosError(error?.name === 'AbortError' ? 'timeout' : 'network');
  } finally { clearTimeout(timer); }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new CosError(text.match(/<Code>([^<]+)<\/Code>/)?.[1] || `HTTP${response.status}`, response.status);
  }
  return `https://${cfg.host}${path}`;
}

// Remember a failing COS for a few minutes inside this isolate so a 12-photo listing
// does not wait for 12 consecutive timeouts before falling back.
let cosBrokenUntil = 0, lastCosError = null;

let imageTable;
const ensureImageTable = () => {
  if (!imageTable) {
    imageTable = sql(`CREATE TABLE IF NOT EXISTS delft_images (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, mime TEXT NOT NULL,
      data_b64 TEXT NOT NULL, bytes INTEGER NOT NULL, created_at TEXT NOT NULL
    )`).then(() => sql('CREATE INDEX IF NOT EXISTS delft_images_created ON delft_images(created_at)'))
      .catch(error => { imageTable = null; throw error; });
  }
  return imageTable;
};

async function storeInDb(owner, base64, bytes) {
  await ensureImageTable();
  const id = crypto.randomUUID();
  await sql('INSERT INTO delft_images(id,owner_id,mime,data_b64,bytes,created_at) VALUES(?,?,?,?,?,?)',
    [id, owner, 'image/jpeg', base64, bytes, new Date().toISOString()]);
  return dbImageUrl(id);
}

/**
 * Stores a validated JPEG. Returns { url, storage: 'cos' | 'db', cosError? }.
 * `IMAGE_STORAGE=db` forces the database store; `IMAGE_STORAGE=cos` disables the fallback.
 */
export async function storeImage(owner, base64, bytes, env = process.env) {
  const mode = String(env.IMAGE_STORAGE || 'auto').trim().toLowerCase();
  const cfg = cosConfig(env);
  let cosError = null;
  if (mode !== 'db' && cfg.valid && Date.now() >= cosBrokenUntil) {
    try {
      const url = await cosPut(cfg, `/delft/${crypto.randomUUID()}.jpg`, bytes);
      lastCosError = null;
      return { url, storage: 'cos' };
    } catch (error) {
      cosError = error.code || 'unknown';
      lastCosError = { code: cosError, at: new Date().toISOString() };
      cosBrokenUntil = Date.now() + 5 * 60 * 1000;
      console.error('COS upload failed:', cosError, error.status || '', cfg.host);
      if (mode === 'cos') throw error;
    }
  } else if (mode === 'cos') {
    throw new CosError(cfg.configured ? 'config' : 'missing');
  } else if (mode !== 'db') {
    cosError = !cfg.configured ? 'missing' : !cfg.valid ? 'config' : lastCosError?.code || 'cooldown';
  }
  const url = await storeInDb(owner, base64, bytes);
  if (Math.random() < 0.05) sweepOrphanImages().catch(error => console.error('image sweep', error));
  return { url, storage: 'db', ...(cosError ? { cosError } : {}) };
}

export async function readDbImage(id) {
  if (!/^[0-9a-f-]{36}$/.test(id || '')) return null;
  await ensureImageTable();
  return (await sql('SELECT mime,data_b64 FROM delft_images WHERE id=?', [id])).rows[0] || null;
}

/** Deletes database images that no listing or cloud draft references after a 3-day grace period. */
export async function sweepOrphanImages() {
  await ensureImageTable();
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();
  return sql(`DELETE FROM delft_images WHERE created_at<?
    AND NOT EXISTS (SELECT 1 FROM delft_listings WHERE instr(items_json, delft_images.id)>0)
    AND NOT EXISTS (SELECT 1 FROM delft_cloud_drafts WHERE instr(draft_json, delft_images.id)>0)`, [cutoff]);
}

/** Deletes database images referenced by the given listings' items (used on delete/erase). */
export async function deleteDbImagesFor(itemsJsonList) {
  const ids = new Set();
  for (const raw of itemsJsonList) {
    for (const match of String(raw || '').matchAll(/\/api\/delft-image\?id=([0-9a-f-]{36})/g)) ids.add(match[1]);
  }
  if (!ids.size) return;
  await ensureImageTable();
  for (const id of ids) await sql('DELETE FROM delft_images WHERE id=?', [id]);
}

/** Non-secret diagnostics for GET /api/delft-upload?check=1. */
export async function storageHealth(env = process.env, { probe = true } = {}) {
  const cfg = cosConfig(env);
  const mode = String(env.IMAGE_STORAGE || 'auto').trim().toLowerCase();
  const report = {
    mode,
    cos: { configured: cfg.configured, missing: cfg.missing, problems: cfg.problems, bucket: cfg.bucket || null, region: cfg.region || null },
    fallback: mode === 'cos' ? 'disabled' : 'database',
  };
  if (probe && cfg.valid && mode !== 'db') {
    try {
      // Fixed key: repeated checks overwrite one tiny object instead of accumulating files.
      await cosPut(cfg, '/delft/.healthcheck', new TextEncoder().encode('ok'), 'text/plain', 6000);
      report.cos.writable = true;
    } catch (error) {
      report.cos.writable = false;
      report.cos.error = error.code || 'unknown';
      report.cos.reason = cosReason(report.cos.error);
    }
  }
  report.uploadsWork = report.cos.writable === true || report.fallback === 'database';
  return report;
}
