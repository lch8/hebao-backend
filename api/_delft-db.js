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
        cancel_reason TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT ''
      )`);
      const eventCols = (await sql('PRAGMA table_info(delft_events)')).rows;
      await addColumnIfMissing('delft_events', eventCols, 'city', "TEXT NOT NULL DEFAULT 'delft'");
      await addColumnIfMissing('delft_events', eventCols, 'contact_hint', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfMissing('delft_events', eventCols, 'cancel_reason', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfMissing('delft_events', eventCols, 'updated_at', "TEXT NOT NULL DEFAULT ''");

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
        created_at TEXT NOT NULL
      )`);
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
      await sql(`CREATE TABLE IF NOT EXISTS delft_notify_log (
        dedupe_key TEXT PRIMARY KEY, sent_at TEXT NOT NULL
      )`);

      await sql('CREATE INDEX IF NOT EXISTS delft_listings_updated ON delft_listings(updated_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_listings_owner ON delft_listings(owner_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_messages_receiver ON delft_messages(receiver_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_messages_sender ON delft_messages(sender_id,created_at)');
      await sql('CREATE INDEX IF NOT EXISTS delft_event_msgs_idx ON delft_event_messages(event_id,created_at)');
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
