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

        // 核心 SQL：把当前用户作为发送方或接收方的聊天找出来，按人头分组，取最新的一条消息！
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

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error(result.results[0].error.message);

        const resData = result.results[0].response.result;
        const cols = resData.cols.map(c => c.name);
        const conversations = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => obj[cols[i]] = val.value);
            return obj;
        });

        return new Response(JSON.stringify({ success: true, conversations }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}
