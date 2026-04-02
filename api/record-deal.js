// api/record-deal.js
// 买家确认成交时调用，去重逻辑：同一对 (seller_id, buyer_id) 只算一次
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    const token = req.headers.get('Authorization')?.slice(7);
    const buyerId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!buyerId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const { sellerId } = await req.json();
        if (!sellerId) return new Response(JSON.stringify({ error: '缺少 sellerId' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        if (String(buyerId) === String(sellerId)) return new Response(JSON.stringify({ error: '不能和自己成交' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 1. 建表（如不存在）
        // 2. 用 INSERT OR IGNORE 实现去重（同一对只插一次）
        // 3. 重新统计 seller 的不重复成交人数，写回 users.deal_count
        const res = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    // 建表
                    { type: "execute", stmt: { sql: "CREATE TABLE IF NOT EXISTS deals (seller_id TEXT NOT NULL, buyer_id TEXT NOT NULL, PRIMARY KEY (seller_id, buyer_id))" } },
                    // 去重插入
                    { type: "execute", stmt: { sql: "INSERT OR IGNORE INTO deals (seller_id, buyer_id) VALUES (?, ?)", args: [{ type:"text", value: String(sellerId) }, { type:"text", value: String(buyerId) }] } },
                    // 更新卖家的成交人数（统计不重复买家数）
                    { type: "execute", stmt: { sql: "UPDATE users SET deal_count = (SELECT COUNT(*) FROM deals WHERE seller_id = ?) WHERE id = ?", args: [{ type:"text", value: String(sellerId) }, { type:"text", value: String(sellerId) }] } },
                    { type: "close" }
                ]
            })
        });

        if (!res.ok) throw new Error('数据库操作失败');
        const result = await res.json();
        if (result.results && result.results[2]?.type === 'error') throw new Error(result.results[2].error.message);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
}
