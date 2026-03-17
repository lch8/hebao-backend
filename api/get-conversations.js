// api/get-conversations.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) return new Response(JSON.stringify({ error: '缺少用户ID' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 核心 SQL：找出会话并按最新时间排序
        const sql = `
            SELECT 
                CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id,
                MAX(created_at) as last_time,
                content as last_message
            FROM messages 
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY partner_id
            ORDER BY last_time DESC
        `;

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            sql: sql, 
                            args: [
                                { type: "text", value: String(userId) },
                                { type: "text", value: String(userId) },
                                { type: "text", value: String(userId) }
                            ] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        // 🌟 终极防爆盾
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Turso 拒绝连接 (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        if (result.message || result.error) throw new Error(`Turso 报错: ${result.message || result.error}`);
        if (!result.results || !result.results[0]) throw new Error(`Turso 返回格式异常: ${JSON.stringify(result)}`);
        if (result.results[0].type === 'error') throw new Error(`Turso SQL 报错: ${result.results[0].error.message}`);

        const resData = result.results[0].response.result;
        const cols = resData.cols.map(c => c.name);
        const conversations = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => obj[cols[i]] = val.value);
            return obj;
        });

        return new Response(JSON.stringify({ success: true, conversations }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        // 将真实错误抛给前端
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
