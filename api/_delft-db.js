// Shared Turso HTTP helper. Values are always bound, never interpolated into SQL.
const toArg = (value) => value == null
  ? { type: 'null' }
  : typeof value === 'number'
    ? { type: Number.isInteger(value) ? 'integer' : 'float', value: String(value) }
    : { type: 'text', value: String(value) };

export async function sql(statement, params = []) {
  const url = process.env.TURSO_DATABASE_URL?.replace(/^libsql:\/\//, 'https://');
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error('Database is not configured');
  const response = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ requests: [
      { type: 'execute', stmt: { sql: statement, args: params.map(toArg) } },
      { type: 'close' }
    ] })
  });
  if (!response.ok) throw new Error(`Database request failed (${response.status})`);
  const body = await response.json();
  const first = body.results?.[0];
  if (!first || first.type === 'error') throw new Error(first?.error?.message || 'Database query failed');
  const result = first.response?.result;
  if (!result) throw new Error('Invalid database response');
  return { rows: (result.rows || []).map(row => Object.fromEntries(result.cols.map((c, i) => [c.name, row[i]?.value ?? null]))), affected: Number(result.affected_row_count || 0) };
}

async function addColumnIfMissing(table, existingCols, colName, definition) {
  if (!existingCols.some(c => c.name === colName)) {
    try { await sql(`ALTER TABLE ${table} ADD COLUMN ${colName} ${definition}`); }
    catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  }
}

let schemaPromise;
export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, verified_email TEXT,
        email_verified INTEGER DEFAULT 0, deal_count INTEGER DEFAULT 0
      )`);
      const userCols = (await sql('PRAGMA table_info(users)')).rows;
      await addColumnIfMissing('users', userCols, 'deal_count', 'INTEGER DEFAULT 0');

      await sql(`CREATE TABLE IF NOT EXISTS verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT,
        attempts INTEGER DEFAULT 0
      )`);
      const otpCols = (await sql('PRAGMA table_info(verification_codes)')).rows;
      await addColumnIfMissing('verification_codes', otpCols, 'created_at', 'TEXT');
      await addColumnIfMissing('verification_codes', otpCols, 'attempts', 'INTEGER DEFAULT 0');
      await sql('CREATE TABLE IF NOT EXISTS auth_rate_limits (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');
      await sql(`CREATE TABLE IF NOT EXISTS delft_listings (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, seller_name TEXT NOT NULL,
        title TEXT NOT NULL, pickup TEXT NOT NULL, note TEXT NOT NULL,
        items_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        city TEXT NOT NULL DEFAULT 'delft'
      )`);
      const listingCols = (await sql('PRAGMA table_info(delft_listings)')).rows;
      await addColumnIfMissing('delft_listings', listingCols, 'city', "TEXT NOT NULL DEFAULT 'delft'");

      await sql(`CREATE TABLE IF NOT EXISTS delft_events (
        id TEXT PRIMARY KEY, host_id TEXT NOT NULL, host_name TEXT NOT NULL,
        title TEXT NOT NULL, category TEXT NOT NULL, starts_at TEXT NOT NULL,
        place TEXT NOT NULL, description TEXT NOT NULL, capacity INTEGER NOT NULL,
        cancelled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
        city TEXT NOT NULL DEFAULT 'delft', contact_hint TEXT NOT NULL DEFAULT '',
        cancel_reason TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT '',
        mode TEXT NOT NULL DEFAULT 'offline',
        schedule_type TEXT NOT NULL DEFAULT 'fixed',
        schedule_note TEXT NOT NULL DEFAULT '',
        tags_json TEXT NOT NULL DEFAULT '[]'
      )`);
      const eventCols = (await sql('PRAGMA table_info(delft_events)')).rows;
      await addColumnIfMissing('delft_events', eventCols, 'city', "TEXT NOT NULL DEFAULT 'delft'");
      await addColumnIfMissing('delft_events', eventCols, 'contact_hint', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfMissing('delft_events', eventCols, 'cancel_reason', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfMissing('delft_events', eventCols, 'updated_at', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfMissing('delft_events', eventCols, 'mode', "TEXT NOT NULL DEFAULT 'offline'");
      await addColumnIfMissing('delft_events', eventCols, 'schedule_type', "TEXT NOT NULL DEFAULT 'fixed'");
      await addColumnIfMissing('delft_events', eventCols, 'schedule_note', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfMissing('delft_events', eventCols, 'tags_json', "TEXT NOT NULL DEFAULT '[]'");

      await sql(`CREATE TABLE IF NOT EXISTS delft_rsvps (
        event_id TEXT NOT NULL, user_id TEXT NOT NULL, nickname TEXT NOT NULL,
        created_at TEXT NOT NULL, PRIMARY KEY(event_id,user_id)
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_messages (
        id TEXT PRIMARY KEY, listing_id TEXT NOT NULL,
        sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL,
        content TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT
      )`);
      const msgCols = (await sql('PRAGMA table_info(delft_messages)')).rows;
      await addColumnIfMissing('delft_messages', msgCols, 'read_at', 'TEXT');

      await sql(`CREATE TABLE IF NOT EXISTS delft_event_messages (
        id TEXT PRIMARY KEY, event_id TEXT NOT NULL, user_id TEXT NOT NULL,
        nickname TEXT NOT NULL, is_host INTEGER NOT NULL DEFAULT 0,
        content TEXT NOT NULL, created_at TEXT NOT NULL
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_reports (
        id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_type TEXT NOT NULL,
        target_id TEXT NOT NULL, reason TEXT NOT NULL, detail TEXT NOT NULL,
        created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open'
      )`);
      const repCols = (await sql('PRAGMA table_info(delft_reports)')).rows;
      await addColumnIfMissing('delft_reports', repCols, 'status', "TEXT NOT NULL DEFAULT 'open'");

      await sql(`CREATE TABLE IF NOT EXISTS delft_feedback (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, contact TEXT NOT NULL,
        category TEXT NOT NULL, content TEXT NOT NULL, page TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_study_progress (
        user_id TEXT PRIMARY KEY, study_json TEXT NOT NULL,
        prep_json TEXT NOT NULL, updated_at TEXT NOT NULL
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_cloud_drafts (
        user_id TEXT PRIMARY KEY, draft_json TEXT NOT NULL, updated_at TEXT NOT NULL
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_metrics (
        day TEXT NOT NULL, event TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(day,event)
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_sources (
        day TEXT NOT NULL, source TEXT NOT NULL, event TEXT NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,source,event)
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_banned_users (
        user_id TEXT PRIMARY KEY, email TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_daily_news (
        day TEXT PRIMARY KEY, items_json TEXT NOT NULL, created_at TEXT NOT NULL
      )`);
      await sql(`CREATE TABLE IF NOT EXISTS delft_notify_log (
        dedupe_key TEXT PRIMARY KEY, sent_at TEXT NOT NULL
      )`);

      await sql('CREATE INDEX IF NOT EXISTS delft_listings_updated ON delft_listings(updated_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_listings_owner ON delft_listings(owner_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_messages_receiver ON delft_messages(receiver_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_messages_sender ON delft_messages(sender_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_event_msgs_idx ON delft_event_messages(event_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_banned_email_idx ON delft_banned_users(email)');
    })();
  }
  try { await schemaPromise; } catch (error) { schemaPromise = null; throw error; }
}

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

export const clipped = (value, max = 120) => String(value ?? '').trim().slice(0, max);
export const authId = async (request) => {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const { verifyJwt } = await import('./_auth.js');
  const user = await verifyJwt(token, process.env.JWT_SECRET);
  return typeof user==='string' && user.length>0 && user.length<=90 ? user : null;
};

export async function isAdminUser(userId) {
  if (!userId) return false;
  const admins = String(process.env.ADMIN_NOTIFY_EMAIL || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.length) return false;
  const row = (await sql('SELECT verified_email FROM users WHERE id=?', [userId])).rows[0];
  const email = String(row?.verified_email || '').trim().toLowerCase();
  return Boolean(email && admins.includes(email));
}

export async function isUserBanned(userId, email = '') {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (userId) {
    const byId = (await sql('SELECT user_id FROM delft_banned_users WHERE user_id=? LIMIT 1', [userId])).rows[0];
    if (byId) return true;
  }
  if (cleanEmail) {
    const byEmail = (await sql('SELECT user_id FROM delft_banned_users WHERE email=? LIMIT 1', [cleanEmail])).rows[0];
    if (byEmail) return true;
  }
  return false;
}

/** Probabilistic housekeeping to prevent expired OTP and notify logs from accumulating. */
export async function cleanupOldTempRows() {
  const nowIso = new Date().toISOString();
  const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();
  await Promise.allSettled([
    sql('DELETE FROM verification_codes WHERE expires_at < ?', [nowIso]),
    sql('DELETE FROM delft_notify_log WHERE sent_at < ?', [weekAgoIso]),
  ]);
}
