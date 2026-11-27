import { sql, ensureSchema, json, clipped, authId } from './_delft-db.js';
import { sendTransactionalEmail, notifyEventAttendees } from './_notify.js';
import { isCosUrl, isDbImageUrl, deleteDbImagesFor } from './_image-store.js';
export const config = { runtime: 'edge' };

const statuses = new Set(['available', 'reserved', 'sold']);
const categories = new Set(['桌游', '散步', '运动', '咖啡', '其他']);
const itemCategories = new Set(['家具', '自行车', '数码', '生活用品', '书籍', '其他']);
const validCities = new Set(['delft', 'den-haag', 'rotterdam', 'amsterdam', 'utrecht', 'eindhoven']);
const cityLabels = {
  delft: 'Delft', 'den-haag': 'Den Haag', rotterdam: 'Rotterdam',
  amsterdam: 'Amsterdam', utrecht: 'Utrecht', eindhoven: 'Eindhoven'
};
const funnelEvents = new Set([
  'page_view', 'auth_request', 'auth_success', 'poster_generate',
  'listing_publish', 'event_create', 'event_rsvp', 'inquiry_send', 'a2_practice'
]);
const reportTargets = new Set(['listing', 'event', 'message']);
const reportReasons = new Set(['疑似诈骗或定金诱导', '虚假或违禁商品', '骚扰或不当言论', '活动信息失实', '其他问题']);
const feedbackCategories = new Set(['问题反馈', '功能建议', '体验吐槽', '其他']);

class InputError extends Error {}

// Photos may live on Tencent COS or in the database fallback (/api/delft-image?id=<uuid>).
const safeUrl = value => isDbImageUrl(value) ? String(value) : isCosUrl(value) ? new URL(value).href : '';

async function ipQuotaKey(request, prefix) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const secret = process.env.JWT_SECRET || 'hebao';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${prefix}:${day}:${ip}:${secret}`));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPublicQuota(request, prefix, limit) {
  const key = await ipQuotaKey(request, prefix);
  await sql('CREATE TABLE IF NOT EXISTS delft_public_quota (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');
  const res = await sql(
    'INSERT INTO delft_public_quota(id,hits) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<? RETURNING hits',
    [key, limit]
  );
  return res.rows.length > 0;
}

const amsterdamTimeLabel = iso => {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Europe/Amsterdam', month: 'long', day: 'numeric',
      weekday: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso));
  } catch { return String(iso || ''); }
};

const parseItems = (source) => {
  if (!Array.isArray(source) || !source.length || source.length > 12) throw new InputError('请提供 1–12 件商品');
  const ids = new Set();
  return source.map((i) => {
    if (!i || typeof i !== 'object' || Array.isArray(i)) throw new InputError('商品信息格式有误');
    const name = clipped(i.name, 70), price = i.price === '' || i.price == null ? null : Number(i.price);
    if (!name || (price !== null && (!['string', 'number'].includes(typeof i.price) || !Number.isFinite(price) || price < 0 || price > 10000))) {
      throw new InputError('请检查商品名称和价格');
    }
    if (i.category && !itemCategories.has(i.category)) throw new InputError('请选择有效的商品分类');
    const id = /^[\w-]{5,60}$/.test(i.id || '') ? i.id : crypto.randomUUID();
    if (ids.has(id)) throw new InputError('商品编号重复，请重新添加商品');
    ids.add(id);
    const photo = safeUrl(i.photo);
    return {
      id, name, category: i.category || '其他',
      price, condition: clipped(i.condition, 140), photo,
      status: statuses.has(i.status) ? i.status : 'available'
    };
  });
};

const listingView = row => ({
  id: row.id,
  city: validCities.has(row.city) ? row.city : 'delft',
  seller: row.seller_name,
  title: row.title,
  pickup: row.pickup,
  note: row.note,
  items: JSON.parse(row.items_json).map(item => ({ ...item, category: item.category || '其他' })),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  stale: Date.now() - new Date(row.updated_at).getTime() > 14 * 86400000
});

const eventView = row => {
  const joined = Boolean(Number(row.mine || 0));
  const hostIsMe = Boolean(Number(row.host_is_me || 0));
  const canSeePrivate = joined || hostIsMe;
  return {
    city: row.city || 'delft',
    id: row.id,
    host: row.host_name,
    title: row.title,
    category: row.category,
    startsAt: row.starts_at,
    place: row.place,
    description: row.description,
    capacity: Number(row.capacity),
    count: Number(row.rsvp_count || 0) + 1,
    joined,
    hostIsMe,
    cancelled: Boolean(Number(row.cancelled || 0)),
    cancelReason: row.cancel_reason || '',
    hasContactHint: Boolean(row.contact_hint),
    ...(canSeePrivate ? { contactHint: row.contact_hint || '' } : {}),
    messageCount: Number(row.msg_count || 0),
  };
};

const nextUpdate = row => new Date(Math.max(Date.now(), new Date(row.updated_at).getTime() + 1)).toISOString();

const listingFields = body => {
  const seller = clipped(body.seller, 35), title = clipped(body.title, 100), pickup = clipped(body.pickup, 85);
  const city = body.city ? String(body.city).trim() : 'delft';
  if (!validCities.has(city)) throw new InputError('请选择有效的所在城市');
  if (!seller || !title || !pickup) throw new InputError('请填写昵称、清仓标题和自取区域');
  return { city, seller, title, pickup, note: clipped(body.note, 350), items: parseItems(body.items) };
};

export default async function handler(request) {
  try {
    await ensureSchema();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const user = await authId(request);

    if (request.method === 'GET') {
      if (action === 'listing') {
        const id = clipped(url.searchParams.get('id'), 60);
        const row = (await sql('SELECT * FROM delft_listings WHERE id=?', [id])).rows[0];
        return row ? json({ listing: listingView(row) }) : json({ error: '商品页面不存在或已经删除' }, 404);
      }
      if (action === 'listings') {
        const term = clipped(url.searchParams.get('q'), 80);
        const category = clipped(url.searchParams.get('category'), 20);
        const city = clipped(url.searchParams.get('city'), 24);
        if (category && !itemCategories.has(category)) return json({ error: '未知商品分类' }, 400);
        if (city && city !== 'all' && city !== 'zuid-holland' && !validCities.has(city)) {
          return json({ error: '未知城市筛选' }, 400);
        }
        const cityFilter = !city || city === 'all' ? '' : city;
        // Match the search and category against the same available item, before LIMIT.
        const result = await sql(`SELECT l.* FROM delft_listings l WHERE l.updated_at>=?
          AND (?='' OR (?='zuid-holland' AND COALESCE(l.city,'delft') IN ('delft','den-haag','rotterdam')) OR COALESCE(l.city,'delft')=?)
          AND EXISTS (SELECT 1 FROM json_each(l.items_json) item
            WHERE COALESCE(json_extract(item.value,'$.status'),'available')='available'
            AND (?='' OR COALESCE(json_extract(item.value,'$.category'),'其他')=?)
            AND (?='' OR instr(lower(l.title||' '||l.pickup||' '||COALESCE(json_extract(item.value,'$.name'),'')||' '||COALESCE(json_extract(item.value,'$.condition'),'')),lower(?))>0))
          ORDER BY l.updated_at DESC,l.id LIMIT 100`,
          [new Date(Date.now() - 14 * 86400000).toISOString(), cityFilter, cityFilter, cityFilter, category, category, term, term]
        );
        return json({ listings: result.rows.map(listingView) });
      }
      if (action === 'events') {
        const result = await sql(`SELECT e.*,
          (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count,
          (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?) AS mine,
          (SELECT COUNT(*) FROM delft_event_messages em WHERE em.event_id=e.id) AS msg_count,
          CASE WHEN e.host_id=? THEN 1 ELSE 0 END AS host_is_me
          FROM delft_events e WHERE e.cancelled=0 AND e.starts_at > ? ORDER BY e.starts_at LIMIT 60`,
          [user || '', user || '', new Date().toISOString()]
        );
        return json({ events: result.rows.map(eventView) });
      }
      if (action === 'event') {
        const id = clipped(url.searchParams.get('id'), 60);
        const row = (await sql(`SELECT e.*,
          (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count,
          (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?) AS mine,
          (SELECT COUNT(*) FROM delft_event_messages em WHERE em.event_id=e.id) AS msg_count,
          CASE WHEN e.host_id=? THEN 1 ELSE 0 END AS host_is_me
          FROM delft_events e WHERE e.id=?`, [user || '', user || '', id])).rows[0];
        return row ? json({ event: eventView(row) }) : json({ error: '邀约不存在或已删除' }, 404);
      }

      if (!user) return json({ error: '请先登录' }, 401);

      if (action === 'unread') {
        const row = (await sql('SELECT COUNT(*) AS n FROM delft_messages WHERE receiver_id=? AND read_at IS NULL', [user])).rows[0];
        return json({ unreadCount: Number(row?.n || 0) });
      }
      if (action === 'mine') {
        const recentCutoff = new Date(Date.now() - 14 * 86400000).toISOString();
        const [listings, events, myEvents, unreadRow] = await Promise.all([
          sql('SELECT * FROM delft_listings WHERE owner_id=? ORDER BY created_at DESC LIMIT 100', [user]),
          sql('SELECT id FROM delft_events WHERE host_id=? AND cancelled=0 ORDER BY starts_at DESC LIMIT 50', [user]),
          sql(`SELECT e.*,
            (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count,
            (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?) AS mine,
            (SELECT COUNT(*) FROM delft_event_messages em WHERE em.event_id=e.id) AS msg_count,
            CASE WHEN e.host_id=? THEN 1 ELSE 0 END AS host_is_me
            FROM delft_events e
            WHERE (e.host_id=? OR EXISTS (SELECT 1 FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?))
              AND e.starts_at > ?
            ORDER BY e.starts_at DESC LIMIT 50`, [user, user, user, user, recentCutoff]),
          sql('SELECT COUNT(*) AS n FROM delft_messages WHERE receiver_id=? AND read_at IS NULL', [user]),
        ]);
        return json({
          listings: listings.rows.map(listingView),
          hostedEventIds: events.rows.map(e => e.id),
          myEvents: myEvents.rows.map(eventView),
          unreadCount: Number(unreadRow.rows[0]?.n || 0),
        });
      }
      if (action === 'attendees') {
        const id = clipped(url.searchParams.get('id'), 60);
        const host = (await sql('SELECT host_id FROM delft_events WHERE id=?', [id])).rows[0];
        if (!host) return json({ error: '活动不存在' }, 404);
        if (host.host_id !== user) return json({ error: '仅组织者可查看报名者' }, 403);
        const r = await sql('SELECT nickname,created_at FROM delft_rsvps WHERE event_id=? ORDER BY created_at', [id]);
        return json({ attendees: r.rows.map(x => ({ nickname: x.nickname, createdAt: x.created_at })) });
      }
      if (action === 'eventMessages') {
        const eventId = clipped(url.searchParams.get('eventId'), 60);
        const ev = (await sql(
          `SELECT e.id, e.host_id, e.contact_hint, e.cancelled, e.cancel_reason,
            (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?) AS mine
           FROM delft_events e WHERE e.id=?`, [user, eventId]
        )).rows[0];
        if (!ev) return json({ error: '邀约不存在' }, 404);
        if (ev.host_id !== user && !Number(ev.mine)) return json({ error: '仅已报名成员和组织者可查看活动沟通' }, 403);
        const msgs = await sql(
          'SELECT id, user_id, nickname, is_host, content, created_at FROM delft_event_messages WHERE event_id=? ORDER BY created_at ASC LIMIT 120',
          [eventId]
        );
        return json({
          contactHint: ev.contact_hint || '',
          cancelled: Boolean(Number(ev.cancelled || 0)),
          cancelReason: ev.cancel_reason || '',
          messages: msgs.rows.map(m => ({
            id: m.id,
            nickname: m.nickname,
            isHost: Boolean(Number(m.is_host)),
            fromMe: m.user_id === user,
            content: m.content,
            createdAt: m.created_at,
          })),
        });
      }
      if (action === 'messages') {
        const results = await sql(`SELECT m.id, m.listing_id, m.sender_id, m.receiver_id, m.content, m.created_at, m.read_at,
          l.title AS listing_title FROM delft_messages m JOIN delft_listings l ON l.id=m.listing_id
          WHERE m.sender_id=? OR m.receiver_id=? ORDER BY m.created_at DESC LIMIT 100`, [user, user]);
        const messages = results.rows.map(m => ({
          id: m.id,
          listingId: m.listing_id,
          listingTitle: m.listing_title,
          fromMe: m.sender_id === user,
          otherId: m.sender_id === user ? m.receiver_id : m.sender_id,
          content: m.content,
          createdAt: m.created_at,
          unread: m.receiver_id === user && !m.read_at,
        }));
        return json({
          messages,
          unreadCount: messages.filter(m => m.unread).length,
        });
      }
      if (action === 'studyProgress') {
        const row = (await sql('SELECT study_json, prep_json, updated_at FROM delft_study_progress WHERE user_id=?', [user])).rows[0];
        if (!row) return json({ progress: null });
        let study = null, prep = null;
        try { study = JSON.parse(row.study_json); } catch {}
        try { prep = JSON.parse(row.prep_json); } catch {}
        return json({ progress: { study, prep, updatedAt: row.updated_at } });
      }
      if (action === 'cloudDraft') {
        const row = (await sql('SELECT draft_json, updated_at FROM delft_cloud_drafts WHERE user_id=?', [user])).rows[0];
        if (!row) return json({ draft: null });
        try { return json({ draft: JSON.parse(row.draft_json), updatedAt: row.updated_at }); }
        catch { return json({ draft: null }); }
      }
      if (action === 'exportMyData') {
        const [profile, listings, hostedEvents, rsvps, messages, eventMessages, study] = await Promise.all([
          sql('SELECT id, verified_email, deal_count FROM users WHERE id=?', [user]),
          sql('SELECT * FROM delft_listings WHERE owner_id=? ORDER BY created_at DESC', [user]),
          sql('SELECT * FROM delft_events WHERE host_id=? ORDER BY created_at DESC', [user]),
          sql('SELECT * FROM delft_rsvps WHERE user_id=? ORDER BY created_at DESC', [user]),
          sql('SELECT * FROM delft_messages WHERE sender_id=? OR receiver_id=? ORDER BY created_at DESC', [user, user]),
          sql('SELECT * FROM delft_event_messages WHERE user_id=? ORDER BY created_at DESC', [user]),
          sql('SELECT study_json, prep_json, updated_at FROM delft_study_progress WHERE user_id=?', [user]),
        ]);
        return json({
          exportedAt: new Date().toISOString(),
          account: profile.rows[0] || { id: user },
          listings: listings.rows.map(listingView),
          hostedEvents: hostedEvents.rows,
          rsvps: rsvps.rows,
          messages: messages.rows,
          eventMessages: eventMessages.rows,
          studyProgress: study.rows[0] || null,
        });
      }
      return json({ error: '未知请求' }, 404);
    }

    if (request.method !== 'POST') return json({ error: '不支持的方法' }, 405);

    // Public POST endpoints (rate-limited, accessible before sign-in)
    if (action === 'track' || action === 'submitFeedback' || action === 'reportContent') {
      let publicBody;
      try { publicBody = await request.json(); } catch { return json({ error: '请求内容不是有效 JSON' }, 400); }
      if (!publicBody || typeof publicBody !== 'object' || Array.isArray(publicBody)) {
        return json({ error: '请求内容格式有误' }, 400);
      }
      const nowIso = new Date().toISOString();
      if (action === 'track') {
        const ev = String(publicBody.event || '').trim();
        if (!funnelEvents.has(ev)) return json({ error: '未知统计事件' }, 400);
        if (!(await checkPublicQuota(request, 'track', 300))) return json({ ok: true });
        const day = nowIso.slice(0, 10);
        await sql(
          'INSERT INTO delft_metrics(day,event,hits) VALUES(?,?,1) ON CONFLICT(day,event) DO UPDATE SET hits=hits+1',
          [day, ev]
        );
        return json({ ok: true });
      }
      if (action === 'submitFeedback') {
        const content = clipped(publicBody.content, 800);
        const category = feedbackCategories.has(publicBody.category) ? publicBody.category : '问题反馈';
        const contact = clipped(publicBody.contact, 100);
        const page = clipped(publicBody.page, 120);
        if (!content || content.length < 2) return json({ error: '请填写具体的反馈或建议内容' }, 400);
        if (!(await checkPublicQuota(request, 'feedback', 10))) {
          return json({ error: '今日提交反馈次数已达上限，感谢你的支持' }, 429);
        }
        await sql(
          'INSERT INTO delft_feedback(id,user_id,contact,category,content,page,created_at) VALUES(?,?,?,?,?,?,?)',
          [crypto.randomUUID(), user || 'guest', contact, category, content, page, nowIso]
        );
        if (process.env.ADMIN_NOTIFY_EMAIL) {
          await sendTransactionalEmail({
            toEmail: process.env.ADMIN_NOTIFY_EMAIL,
            subject: `【荷包反馈】${category}`,
            heading: `收到新的用户${category}`,
            lines: [content, contact ? `联系方式：${contact}` : '', page ? `所在页面：${page}` : ''],
            ctaLabel: '打开荷包',
            ctaPath: '/',
          });
        }
        return json({ ok: true });
      }
      if (action === 'reportContent') {
        const targetType = String(publicBody.targetType || '').trim();
        const targetId = clipped(publicBody.targetId, 80);
        const reason = reportReasons.has(publicBody.reason) ? publicBody.reason : '其他问题';
        const detail = clipped(publicBody.detail, 500);
        if (!reportTargets.has(targetType) || !targetId) {
          return json({ error: '请选择有效的举报对象和原因' }, 400);
        }
        if (!(await checkPublicQuota(request, 'report', 15))) {
          return json({ error: '今日举报提交次数过多，请稍后再试' }, 429);
        }
        await sql(
          'INSERT INTO delft_reports(id,reporter_id,target_type,target_id,reason,detail,created_at) VALUES(?,?,?,?,?,?,?)',
          [crypto.randomUUID(), user || 'guest', targetType, targetId, reason, detail, nowIso]
        );
        if (process.env.ADMIN_NOTIFY_EMAIL) {
          await sendTransactionalEmail({
            toEmail: process.env.ADMIN_NOTIFY_EMAIL,
            subject: `【荷包举报】${targetType} · ${reason}`,
            heading: '收到新的社区举报',
            lines: [`对象类型：${targetType}`, `对象 ID：${targetId}`, `原因：${reason}`, detail ? `补充说明：${detail}` : ''],
            ctaLabel: '查看站点',
            ctaPath: targetType === 'listing' ? `/market?item=${encodeURIComponent(targetId)}` : '/events',
          });
        }
        return json({ ok: true });
      }
    }

    if (!user) return json({ error: '发布、报名和私信需要先邮箱登录' }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: '请求内容不是有效 JSON' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: '请求内容格式有误' }, 400);
    const now = new Date().toISOString();

    if (action === 'createListing') {
      const { city, seller, title, pickup, note, items } = listingFields(body);
      const active = await sql('SELECT COUNT(*) AS n FROM delft_listings WHERE owner_id=? AND updated_at>?', [user, new Date(Date.now() - 30 * 86400000).toISOString()]);
      if (Number(active.rows[0]?.n) >= 30) return json({ error: '最近发布数量过多' }, 429);
      const id = crypto.randomUUID();
      await sql(`INSERT INTO delft_listings
        (id,owner_id,seller_name,title,pickup,note,items_json,created_at,updated_at,city)
        VALUES(?,?,?,?,?,?,?,?,?,?)`, [id, user, seller, title, pickup, note, JSON.stringify(items), now, now, city]);
      return json({ ok: true, id, updatedAt: now });
    }
    if (action === 'updateListing' || action === 'refreshListing') {
      const id = clipped(body.listingId, 60);
      const row = (await sql('SELECT * FROM delft_listings WHERE id=?', [id])).rows[0];
      if (!row) return json({ error: '清仓页不存在' }, 404);
      if (row.owner_id !== user) return json({ error: '无权修改其他人的清仓页' }, 403);
      const updatedAt = nextUpdate(row);
      let result;
      if (action === 'updateListing') {
        if (!body.expectedUpdatedAt || body.expectedUpdatedAt !== row.updated_at) {
          return json({ error: '清仓页已在其他窗口更新，请重新打开编辑后再保存' }, 409);
        }
        const { city, seller, title, pickup, note, items } = listingFields(body);
        result = await sql(`UPDATE delft_listings SET city=?,seller_name=?,title=?,pickup=?,note=?,items_json=?,updated_at=?
          WHERE id=? AND owner_id=? AND updated_at=?`, [city, seller, title, pickup, note, JSON.stringify(items), updatedAt, id, user, row.updated_at]);
      } else {
        result = await sql('UPDATE delft_listings SET updated_at=? WHERE id=? AND owner_id=? AND updated_at=?', [updatedAt, id, user, row.updated_at]);
      }
      if (!result.affected) return json({ error: '清仓页刚刚发生变化，请刷新后重试' }, 409);
      return json({ ok: true, id, updatedAt });
    }
    if (action === 'deleteListing') {
      const id = clipped(body.listingId, 60);
      const owner = (await sql('SELECT owner_id FROM delft_listings WHERE id=?', [id])).rows[0];
      if (!owner) return json({ error: '页面不存在' }, 404);
      if (owner.owner_id !== user) return json({ error: '无权删除' }, 403);
      const photos = (await sql('SELECT items_json FROM delft_listings WHERE id=?', [id])).rows.map(r => r.items_json);
      await sql('DELETE FROM delft_messages WHERE listing_id=?', [id]);
      await sql('DELETE FROM delft_listings WHERE id=? AND owner_id=?', [id, user]);
      await deleteDbImagesFor(photos).catch(error => console.error('delete listing images', error));
      return json({ ok: true });
    }
    if (action === 'updateStatus') {
      const id = clipped(body.listingId, 60), itemId = clipped(body.itemId, 60);
      if (!statuses.has(body.status)) return json({ error: '无效状态' }, 400);
      const result = await sql('SELECT owner_id,items_json,updated_at FROM delft_listings WHERE id=?', [id]);
      const row = result.rows[0];
      if (!row) return json({ error: '清仓页不存在' }, 404);
      if (row.owner_id !== user) return json({ error: '无权修改其他人的商品' }, 403);
      const items = JSON.parse(row.items_json);
      const item = items.find(i => i.id === itemId);
      if (!item) return json({ error: '商品不存在' }, 404);
      item.status = body.status;
      const updatedAt = nextUpdate(row);
      const saved = await sql('UPDATE delft_listings SET items_json=?,updated_at=? WHERE id=? AND owner_id=? AND items_json=? AND updated_at=?', [JSON.stringify(items), updatedAt, id, user, row.items_json, row.updated_at]);
      if (!saved.affected) return json({ error: '其他窗口刚刚更新了商品，请刷新后重试' }, 409);
      return json({ ok: true, updatedAt });
    }
    if (action === 'createEvent') {
      const title = clipped(body.title, 75), host = clipped(body.host, 35), place = clipped(body.place, 100);
      const description = clipped(body.description, 450), contactHint = clipped(body.contactHint, 180);
      const date = new Date(body.startsAt);
      const capacity = Number(body.capacity);
      const city = body.city || 'delft';
      if (!validCities.has(city)) return json({ error: '请选择活动城市' }, 400);
      if (!title || !host || !place || !Number.isFinite(date.getTime()) ||
        date.getTime() < Date.now() + 3600000 || date.getTime() > Date.now() + 60 * 86400000 ||
        !Number.isInteger(capacity) || capacity < 2 || capacity > 12 || !categories.has(body.category)) {
        return json({ error: '请填写有效活动信息（至少提前1小时，2–12人）' }, 400);
      }
      const count = await sql('SELECT COUNT(*) AS n FROM delft_events WHERE host_id=? AND created_at>?', [user, new Date(Date.now() - 30 * 86400000).toISOString()]);
      if (Number(count.rows[0]?.n) >= 8) return json({ error: '30天内创建活动已达上限' }, 429);
      const id = crypto.randomUUID();
      await sql(`INSERT INTO delft_events
        (id,host_id,host_name,title,category,starts_at,place,description,capacity,created_at,city,contact_hint,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, user, host, title, body.category, date.toISOString(), place, description, capacity, now, city, contactHint, now]
      );
      return json({ ok: true, id });
    }
    if (action === 'updateEvent') {
      const id = clipped(body.eventId, 60);
      const existing = (await sql(
        `SELECT e.*, (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count
         FROM delft_events e WHERE e.id=?`, [id]
      )).rows[0];
      if (!existing) return json({ error: '活动不存在' }, 404);
      if (existing.host_id !== user) return json({ error: '仅发起人可修改邀约安排' }, 403);
      if (Number(existing.cancelled)) return json({ error: '已取消的活动不可修改' }, 400);
      const place = clipped(body.place ?? existing.place, 100);
      const description = clipped(body.description ?? existing.description, 450);
      const contactHint = clipped(body.contactHint ?? existing.contact_hint, 180);
      const date = body.startsAt ? new Date(body.startsAt) : new Date(existing.starts_at);
      const capacity = body.capacity != null ? Number(body.capacity) : Number(existing.capacity);
      const minCap = Math.max(2, Number(existing.rsvp_count || 0) + 1);
      if (!place || !Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 900000 ||
        date.getTime() > Date.now() + 60 * 86400000 || !Number.isInteger(capacity) || capacity < minCap || capacity > 12) {
        return json({ error: `请检查修改后的时间、集合地点或人数上限（当前至少 ${minCap} 人）` }, 400);
      }
      const nextStarts = date.toISOString();
      await sql(
        'UPDATE delft_events SET starts_at=?, place=?, description=?, contact_hint=?, capacity=?, updated_at=? WHERE id=? AND host_id=?',
        [nextStarts, place, description, contactHint, capacity, now, id, user]
      );
      const scheduleChanged = nextStarts !== existing.starts_at || place !== existing.place || contactHint !== (existing.contact_hint || '');
      if (scheduleChanged && Number(existing.rsvp_count) > 0) {
        await notifyEventAttendees(id, () => ({
          dedupeKey: `ev-update:${id}:${nextStarts}:${place}`,
          cooldownMs: 60000,
          subject: `【活动变更】「${existing.title}」集合安排已更新`,
          heading: `你报名的活动「${existing.title}」更新了集合信息`,
          lines: [
            `最新时间：${amsterdamTimeLabel(nextStarts)}（荷兰时间）`,
            `最新集合地点：${cityLabels[existing.city] || existing.city} · ${place}`,
            contactHint ? `集合联络说明：${contactHint}` : '',
          ],
          ctaLabel: '查看最新活动安排',
          ctaPath: `/events?event=${encodeURIComponent(id)}`,
        }));
      }
      return json({ ok: true, id });
    }
    if (action === 'rsvp') {
      const id = clipped(body.eventId, 60), nickname = clipped(body.nickname, 35);
      if (!nickname) return json({ error: '请填写参与活动的昵称' }, 400);
      // INSERT ... SELECT keeps the capacity check and RSVP insertion atomic in SQLite.
      const result = await sql(`INSERT OR IGNORE INTO delft_rsvps(event_id,user_id,nickname,created_at)
        SELECT e.id,?,?,? FROM delft_events e
        WHERE e.id=? AND e.cancelled=0 AND e.host_id<>? AND e.starts_at>?
          AND (SELECT COUNT(*) FROM delft_rsvps WHERE event_id=e.id) < e.capacity-1`,
        [user, nickname, now, id, user, now]
      );
      if (!result.affected) return json({ error: '活动已满、已报名或不可报名' }, 409);
      const ev = (await sql(
        `SELECT e.host_id, e.title, e.starts_at, e.place, e.capacity, e.contact_hint,
          (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count
         FROM delft_events e WHERE e.id=?`, [id]
      )).rows[0];
      if (ev) {
        await sendTransactionalEmail({
          toUserId: ev.host_id,
          dedupeKey: `rsvp:${id}:${user}`,
          cooldownMs: 300000,
          subject: `新报名提醒：${nickname} 报名了「${ev.title}」`,
          heading: `${nickname} 刚刚报名了你的同城邀约`,
          lines: [
            `活动：${ev.title}`,
            `当前人数：${Number(ev.rsvp_count || 0) + 1} / ${ev.capacity} 人`,
            `时间与地点：${amsterdamTimeLabel(ev.starts_at)} · ${ev.place}`,
          ],
          ctaLabel: '查看报名名单与活动沟通',
          ctaPath: `/events?event=${encodeURIComponent(id)}`,
        });
      }
      return json({ ok: true, contactHint: ev?.contact_hint || '' });
    }
    if (action === 'cancelRsvp') {
      await sql('DELETE FROM delft_rsvps WHERE event_id=? AND user_id=?', [clipped(body.eventId, 60), user]);
      return json({ ok: true });
    }
    if (action === 'cancelEvent') {
      const id = clipped(body.eventId, 60);
      const reason = clipped(body.reason, 180);
      const ev = (await sql('SELECT title, starts_at, place, host_name FROM delft_events WHERE id=? AND host_id=? AND cancelled=0', [id, user])).rows[0];
      const res = await sql('UPDATE delft_events SET cancelled=1, cancel_reason=?, updated_at=? WHERE id=? AND host_id=? AND cancelled=0', [reason, now, id, user]);
      if (res.affected && ev) {
        await notifyEventAttendees(id, () => ({
          subject: `【活动取消】「${ev.title}」已取消`,
          heading: `很抱歉，你报名的活动「${ev.title}」已被发起人取消`,
          lines: [
            `原定时间：${amsterdamTimeLabel(ev.starts_at)}`,
            `原定地点：${ev.place}`,
            reason ? `取消说明：${reason}` : '发起人临时取消了本次活动，请勿前往集合地点。',
          ],
          ctaLabel: '看看其他同城活动',
          ctaPath: '/events',
        }));
      }
      return json({ ok: true });
    }
    if (action === 'sendEventMessage') {
      const eventId = clipped(body.eventId, 60), content = clipped(body.content, 400);
      if (!content) return json({ error: '请输入留言内容' }, 400);
      const ev = (await sql(
        `SELECT e.id, e.host_id, e.host_name, e.title, e.cancelled,
          (SELECT nickname FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?) AS rsvp_nick
         FROM delft_events e WHERE e.id=?`, [user, eventId]
      )).rows[0];
      if (!ev) return json({ error: '活动不存在' }, 404);
      if (Number(ev.cancelled)) return json({ error: '活动已取消，无法继续留言' }, 400);
      const isHost = ev.host_id === user;
      if (!isHost && !ev.rsvp_nick) return json({ error: '仅已报名成员和组织者可在活动内沟通' }, 403);
      const recent = (await sql('SELECT COUNT(*) AS n FROM delft_event_messages WHERE user_id=? AND created_at>?', [user, new Date(Date.now() - 86400000).toISOString()])).rows[0];
      if (Number(recent?.n) >= 60) return json({ error: '今日活动留言次数已达上限' }, 429);
      const senderNick = isHost ? ev.host_name : ev.rsvp_nick;
      await sql(
        'INSERT INTO delft_event_messages(id,event_id,user_id,nickname,is_host,content,created_at) VALUES(?,?,?,?,?,?,?)',
        [crypto.randomUUID(), eventId, user, senderNick, isHost ? 1 : 0, content, now]
      );
      if (isHost) {
        await notifyEventAttendees(eventId, row => ({
          dedupeKey: `ev-msg-host:${eventId}:${row.user_id}`,
          cooldownMs: 600000,
          subject: `【集合沟通】发起人在「${ev.title}」发布了新消息`,
          heading: `发起人 ${senderNick} 在「${ev.title}」留言了`,
          lines: [`「${content}」`],
          ctaLabel: '打开活动查看并回复',
          ctaPath: `/events?event=${encodeURIComponent(eventId)}`,
        }));
      } else {
        await sendTransactionalEmail({
          toUserId: ev.host_id,
          dedupeKey: `ev-msg-guest:${eventId}`,
          cooldownMs: 300000,
          subject: `【活动留言】${senderNick} 在「${ev.title}」发来消息`,
          heading: `参与者 ${senderNick} 在「${ev.title}」留言`,
          lines: [`「${content}」`],
          ctaLabel: '查看活动留言',
          ctaPath: `/events?event=${encodeURIComponent(eventId)}`,
        });
      }
      return json({ ok: true });
    }
    if (action === 'sendMessage') {
      const listingId = clipped(body.listingId, 60), content = clipped(body.content, 500), receiver = clipped(body.receiverId, 90);
      if (!content) return json({ error: '请输入消息内容' }, 400);
      const listing = (await sql('SELECT owner_id, title, seller_name FROM delft_listings WHERE id=?', [listingId])).rows[0];
      if (!listing) return json({ error: '商品信息不存在' }, 404);
      // Buyers can only contact listing owners; owners can reply to buyers who already contacted them.
      if (listing.owner_id !== user) {
        if (receiver && receiver !== listing.owner_id) return json({ error: '不能向此用户发送消息' }, 403);
      } else {
        const prior = (await sql('SELECT id FROM delft_messages WHERE listing_id=? AND sender_id=? AND receiver_id=? LIMIT 1', [listingId, receiver, user])).rows[0];
        if (!receiver || !prior) return json({ error: '只能回复已经咨询的买家' }, 403);
      }
      const recipient = listing.owner_id !== user ? listing.owner_id : receiver;
      const messagesToday = (await sql('SELECT COUNT(*) AS n FROM delft_messages WHERE sender_id=? AND created_at>?', [user, new Date(Date.now() - 86400000).toISOString()])).rows[0];
      if (Number(messagesToday?.n) >= 80) return json({ error: '今日消息数量已达上限' }, 429);
      await sql('INSERT INTO delft_messages(id,listing_id,sender_id,receiver_id,content,created_at) VALUES(?,?,?,?,?,?)', [crypto.randomUUID(), listingId, user, recipient, content, now]);

      const isBuyerToSeller = listing.owner_id !== user;
      await sendTransactionalEmail({
        toUserId: recipient,
        dedupeKey: `msg:${listingId}:${user}:${recipient}`,
        cooldownMs: 300000,
        subject: isBuyerToSeller
          ? `【闲置咨询】有人询问你的「${listing.title}」`
          : `【卖家回复】关于「${listing.title}」的新消息`,
        heading: isBuyerToSeller
          ? `有买家向你咨询「${listing.title}」`
          : `卖家 ${listing.seller_name} 回复了你的咨询`,
        lines: [`消息内容：「${content}」`],
        ctaLabel: '前往「我的 → 私信」回复',
        ctaPath: '/mine?view=messages',
      });
      return json({ ok: true });
    }
    if (action === 'markRead') {
      const listingId = clipped(body.listingId, 60);
      const otherId = clipped(body.otherId, 90);
      if (listingId && otherId) {
        await sql(
          'UPDATE delft_messages SET read_at=? WHERE receiver_id=? AND listing_id=? AND sender_id=? AND read_at IS NULL',
          [now, user, listingId, otherId]
        );
      } else {
        await sql('UPDATE delft_messages SET read_at=? WHERE receiver_id=? AND read_at IS NULL', [now, user]);
      }
      const unreadRow = (await sql('SELECT COUNT(*) AS n FROM delft_messages WHERE receiver_id=? AND read_at IS NULL', [user])).rows[0];
      return json({ ok: true, unreadCount: Number(unreadRow?.n || 0) });
    }
    if (action === 'saveStudyProgress') {
      const studyJson = JSON.stringify(body.study ?? {});
      const prepJson = JSON.stringify(body.prep ?? {});
      if (studyJson.length > 80000 || prepJson.length > 80000) {
        return json({ error: '学习记录体积超出上限' }, 400);
      }
      await sql(
        `INSERT INTO delft_study_progress(user_id,study_json,prep_json,updated_at) VALUES(?,?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET study_json=excluded.study_json, prep_json=excluded.prep_json, updated_at=excluded.updated_at`,
        [user, studyJson, prepJson, now]
      );
      return json({ ok: true, updatedAt: now });
    }
    if (action === 'saveCloudDraft') {
      const raw = JSON.stringify(body.draft ?? {});
      if (raw.length > 150000) return json({ error: '云端草稿过大' }, 400);
      await sql(
        `INSERT INTO delft_cloud_drafts(user_id,draft_json,updated_at) VALUES(?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET draft_json=excluded.draft_json, updated_at=excluded.updated_at`,
        [user, raw, now]
      );
      return json({ ok: true, updatedAt: now });
    }
    if (action === 'deleteCloudDraft') {
      await sql('DELETE FROM delft_cloud_drafts WHERE user_id=?', [user]);
      return json({ ok: true });
    }
    if (action === 'deleteAccount') {
      if (body.confirm !== 'DELETE') {
        return json({ error: '请输入 DELETE 确认注销账号并删除全部数据' }, 400);
      }
      // Notify attendees of any upcoming hosted events before erasing account records
      const activeHosted = (await sql(
        'SELECT id, title, starts_at, place FROM delft_events WHERE host_id=? AND cancelled=0 AND starts_at>?',
        [user, now]
      )).rows;
      for (const ev of activeHosted) {
        await notifyEventAttendees(ev.id, () => ({
          subject: `【活动取消】「${ev.title}」已取消`,
          heading: `你报名的活动「${ev.title}」因发起人注销账号已取消`,
          lines: [`原定时间：${amsterdamTimeLabel(ev.starts_at)}`, `原定地点：${ev.place}`],
          ctaLabel: '浏览其他同城活动',
          ctaPath: '/events',
        }));
      }
      await sql('DELETE FROM delft_messages WHERE listing_id IN (SELECT id FROM delft_listings WHERE owner_id=?)', [user]);
      await sql('DELETE FROM delft_messages WHERE sender_id=? OR receiver_id=?', [user, user]);
      const ownedPhotos = (await sql('SELECT items_json FROM delft_listings WHERE owner_id=?', [user])).rows.map(r => r.items_json);
      await sql('DELETE FROM delft_listings WHERE owner_id=?', [user]);
      await deleteDbImagesFor(ownedPhotos).catch(error => console.error('delete account images', error));
      await sql('DELETE FROM delft_images WHERE owner_id=?', [user]).catch(() => {});
      await sql('DELETE FROM delft_event_messages WHERE event_id IN (SELECT id FROM delft_events WHERE host_id=?) OR user_id=?', [user, user]);
      await sql('DELETE FROM delft_rsvps WHERE event_id IN (SELECT id FROM delft_events WHERE host_id=?) OR user_id=?', [user, user]);
      await sql('DELETE FROM delft_events WHERE host_id=?', [user]);
      await sql('DELETE FROM delft_study_progress WHERE user_id=?', [user]);
      await sql('DELETE FROM delft_cloud_drafts WHERE user_id=?', [user]);
      await sql('DELETE FROM users WHERE id=?', [user]);
      return json({ ok: true });
    }

    return json({ error: '未知操作' }, 404);
  } catch (error) {
    if (error instanceof InputError) return json({ error: error.message }, 400);
    console.error('Delft API:', error);
    return json({ error: '服务暂时不可用，请稍后重试' }, 500);
  }
}
