import { sql, ensureSchema, json, clipped, authId } from './_delft-db.js';
export const config = { runtime: 'edge' };

const statuses = new Set(['available', 'reserved', 'sold']);
const categories = new Set(['桌游', '散步', '运动', '咖啡', '其他']);
const safeUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && /\.myqcloud\.com$/.test(url.hostname) ? url.href : ''; }
  catch { return ''; }
};
const parseItems = (source) => {
  if (!Array.isArray(source) || !source.length || source.length > 12) throw new Error('请提供 1–12 件商品');
  return source.map((i) => {
    const name = clipped(i.name, 70), price = i.price === '' || i.price == null ? null : Number(i.price);
    if (!name || (price !== null && (!Number.isFinite(price) || price < 0 || price > 10000))) throw new Error('请检查商品名称和价格');
    const photo = safeUrl(i.photo);
    return { id: /^[\w-]{5,60}$/.test(i.id || '') ? i.id : crypto.randomUUID(), name,
      price, condition: clipped(i.condition, 140), photo,
      status: statuses.has(i.status) ? i.status : 'available' };
  });
};
const listingView = row => ({
  id: row.id, seller: row.seller_name, title: row.title, pickup: row.pickup,
  note: row.note, items: JSON.parse(row.items_json), createdAt: row.created_at,
  updatedAt: row.updated_at, stale: Date.now() - new Date(row.updated_at).getTime() > 14 * 86400000
});
const eventView = row => ({
  id: row.id, host: row.host_name, title: row.title, category: row.category,
  startsAt: row.starts_at, place: row.place, description: row.description,
  capacity: Number(row.capacity), count: Number(row.rsvp_count || 0) + 1,
  joined: Boolean(Number(row.mine || 0)), hostIsMe: Boolean(Number(row.host_is_me || 0))
});

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
        return row ? json({ listing: listingView(row) }) : json({ error: '商品页面不存在或已经删除' },404);
      }
      if (action === 'listings') {
        const result = await sql('SELECT * FROM delft_listings ORDER BY created_at DESC LIMIT 100');
        return json({ listings: result.rows.map(listingView) });
      }
      if (action === 'events') {
        const result = await sql(`SELECT e.*, (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count,
          (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id AND r.user_id=?) AS mine,
          CASE WHEN e.host_id=? THEN 1 ELSE 0 END AS host_is_me
          FROM delft_events e WHERE e.cancelled=0 AND e.starts_at > ? ORDER BY e.starts_at LIMIT 60`, [user || '', user || '', new Date().toISOString()]);
        return json({ events: result.rows.map(eventView) });
      }
      if (!user) return json({ error: '请先登录' }, 401);
      if (action === 'mine') {
        const [listings, events] = await Promise.all([
          sql('SELECT * FROM delft_listings WHERE owner_id=? ORDER BY created_at DESC LIMIT 100', [user]),
          sql('SELECT id FROM delft_events WHERE host_id=? AND cancelled=0 ORDER BY starts_at DESC LIMIT 50', [user])
        ]);
        return json({ listings: listings.rows.map(listingView), hostedEventIds: events.rows.map(e => e.id) });
      }
      if (action === 'attendees') {
        const id=clipped(url.searchParams.get('id'),60);
        const host=(await sql('SELECT host_id FROM delft_events WHERE id=?',[id])).rows[0];
        if(!host)return json({error:'活动不存在'},404);
        if(host.host_id!==user)return json({error:'仅组织者可查看报名者'},403);
        const r=await sql('SELECT nickname,created_at FROM delft_rsvps WHERE event_id=? ORDER BY created_at',[id]);
        return json({attendees:r.rows.map(x=>({nickname:x.nickname,createdAt:x.created_at}))});
      }
      if (action === 'messages') {
        const results = await sql(`SELECT m.id, m.listing_id, m.sender_id, m.receiver_id, m.content, m.created_at,
          l.title AS listing_title FROM delft_messages m JOIN delft_listings l ON l.id=m.listing_id
          WHERE m.sender_id=? OR m.receiver_id=? ORDER BY m.created_at DESC LIMIT 100`, [user, user]);
        return json({ messages: results.rows.map(m => ({ id: m.id, listingId: m.listing_id,
          listingTitle: m.listing_title, fromMe: m.sender_id===user, otherId: m.sender_id===user?m.receiver_id:m.sender_id,
          content: m.content, createdAt: m.created_at })) });
      }
      return json({ error: '未知请求' }, 404);
    }
    if (request.method !== 'POST') return json({ error: '不支持的方法' }, 405);
    if (!user) return json({ error: '发布、报名和私信需要先邮箱登录' }, 401);
    const body = await request.json();
    const now = new Date().toISOString();
    if (action === 'createListing') {
      const items = parseItems(body.items);
      const seller = clipped(body.seller, 35), title = clipped(body.title, 100), pickup = clipped(body.pickup, 85);
      if (!seller || !title || !pickup) return json({ error: '请填写昵称、清仓标题和自取区域' }, 400);
      const active = await sql('SELECT COUNT(*) AS n FROM delft_listings WHERE owner_id=? AND updated_at>?', [user, new Date(Date.now()-30*86400000).toISOString()]);
      if (Number(active.rows[0]?.n) >= 30) return json({ error: '最近发布数量过多' }, 429);
      const id = crypto.randomUUID();
      await sql(`INSERT INTO delft_listings
        (id,owner_id,seller_name,title,pickup,note,items_json,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?)`, [id,user,seller,title,pickup,clipped(body.note, 350),JSON.stringify(items),now,now]);
      return json({ ok:true, id });
    }
    if (action === 'deleteListing') {
      const id=clipped(body.listingId,60);
      const owner=(await sql('SELECT owner_id FROM delft_listings WHERE id=?',[id])).rows[0];
      if (!owner) return json({error:'页面不存在'},404);
      if (owner.owner_id!==user) return json({error:'无权删除'},403);
      await sql('DELETE FROM delft_messages WHERE listing_id=?',[id]);
      await sql('DELETE FROM delft_listings WHERE id=? AND owner_id=?',[id,user]);
      return json({ok:true});
    }
    if (action === 'updateStatus') {
      const id = clipped(body.listingId, 60), itemId = clipped(body.itemId, 60);
      if (!statuses.has(body.status)) return json({ error: '无效状态' }, 400);
      const result = await sql('SELECT owner_id,items_json FROM delft_listings WHERE id=?', [id]);
      const row = result.rows[0];
      if (!row) return json({ error: '清仓页不存在' }, 404);
      if (row.owner_id !== user) return json({ error: '无权修改其他人的商品' }, 403);
      const items = JSON.parse(row.items_json);
      const item = items.find(i=>i.id===itemId);
      if (!item) return json({ error: '商品不存在' }, 404);
      item.status = body.status;
      await sql('UPDATE delft_listings SET items_json=?,updated_at=? WHERE id=? AND owner_id=?', [JSON.stringify(items), now,id,user]);
      return json({ ok:true });
    }
    if (action === 'createEvent') {
      const title = clipped(body.title, 75), host = clipped(body.host, 35), place = clipped(body.place, 100);
      const description = clipped(body.description, 450), date = new Date(body.startsAt);
      const capacity = Number(body.capacity);
      if (!title || !host || !place || !Number.isFinite(date.getTime()) ||
        date.getTime() < Date.now()+3600000 || date.getTime()>Date.now()+60*86400000 ||
        !Number.isInteger(capacity) || capacity<2 || capacity>12 || !categories.has(body.category)) {
        return json({ error:'请填写有效活动信息（至少提前1小时，2–12人）' },400);
      }
      const count = await sql('SELECT COUNT(*) AS n FROM delft_events WHERE host_id=? AND created_at>?', [user,new Date(Date.now()-30*86400000).toISOString()]);
      if (Number(count.rows[0]?.n)>=8) return json({error:'30天内创建活动已达上限'},429);
      const id = crypto.randomUUID();
      await sql(`INSERT INTO delft_events
       (id,host_id,host_name,title,category,starts_at,place,description,capacity,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,[id,user,host,title,body.category,date.toISOString(),place,description,capacity,now]);
      return json({ok:true,id});
    }
    if (action === 'rsvp') {
      const id=clipped(body.eventId,60), nickname=clipped(body.nickname,35);
      if (!nickname) return json({error:'请填写参与活动的昵称'},400);
      // INSERT ... SELECT keeps the capacity check and RSVP insertion atomic in SQLite.
      const result = await sql(`INSERT OR IGNORE INTO delft_rsvps(event_id,user_id,nickname,created_at)
        SELECT e.id,?,?,? FROM delft_events e
        WHERE e.id=? AND e.cancelled=0 AND e.host_id<>? AND e.starts_at>?
          AND (SELECT COUNT(*) FROM delft_rsvps WHERE event_id=e.id) < e.capacity-1`,
       [user,nickname,now,id,user,now]);
      if (!result.affected) return json({error:'活动已满、已报名或不可报名'},409);
      return json({ok:true});
    }
    if (action === 'cancelRsvp') {
      await sql('DELETE FROM delft_rsvps WHERE event_id=? AND user_id=?', [clipped(body.eventId,60),user]);
      return json({ok:true});
    }
    if (action === 'cancelEvent') {
      await sql('UPDATE delft_events SET cancelled=1 WHERE id=? AND host_id=?', [clipped(body.eventId,60),user]);
      return json({ok:true});
    }
    if (action === 'sendMessage') {
      const listingId = clipped(body.listingId,60), content = clipped(body.content,500), receiver=clipped(body.receiverId,90);
      if (!content) return json({error:'请输入消息内容'},400);
      const listing = (await sql('SELECT owner_id FROM delft_listings WHERE id=?',[listingId])).rows[0];
      if (!listing) return json({error:'商品信息不存在'},404);
      // Buyers can only contact listing owners; owners can reply to buyers who already contacted them.
      if (listing.owner_id !== user) {
        if (receiver && receiver !== listing.owner_id) return json({error:'不能向此用户发送消息'},403);
      } else {
        const prior = (await sql('SELECT id FROM delft_messages WHERE listing_id=? AND sender_id=? AND receiver_id=? LIMIT 1',[listingId,receiver,user])).rows[0];
        if (!receiver || !prior) return json({error:'只能回复已经咨询的买家'},403);
      }
      const recipient = listing.owner_id !== user ? listing.owner_id : receiver;
      const messagesToday=(await sql('SELECT COUNT(*) AS n FROM delft_messages WHERE sender_id=? AND created_at>?',[user,new Date(Date.now()-86400000).toISOString()])).rows[0];
      if (Number(messagesToday?.n)>=80) return json({error:'今日消息数量已达上限'},429);
      await sql('INSERT INTO delft_messages(id,listing_id,sender_id,receiver_id,content,created_at) VALUES(?,?,?,?,?,?)',[crypto.randomUUID(),listingId,user,recipient,content,now]);
      return json({ok:true});
    }
    return json({error:'未知操作'},404);
  } catch (error) {
    console.error('Delft API:', error);
    return json({ error: '服务暂时不可用，请稍后重试' },500);
  }
}
