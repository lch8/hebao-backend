import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        const url = new URL(req.url);
        const userId1 = url.searchParams.get('userId1'); // 当前用户
        const userId2 = url.searchParams.get('userId2'); // 对方用户
        
        if (!userId1 || !userId2) return new Response(JSON.stringify({ error: '缺少用户ID' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 拉取双方最近的 50 条聊天记录，按时间升序（旧的在上面，新的在下面）
        const sql = `
            SELECT id, sender_id, receiver_id, content, created_at 
            FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC LIMIT 50
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
                                { type: "text", value: String(userId1) }, { type: "text", value: String(userId2) },
                                { type: "text", value: String(userId2) }, { type: "text", value: String(userId1) }
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
        const messages = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => obj[cols[i]] = val.value);
            return obj;
        });

        return new Response(JSON.stringify({ success: true, messages }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}
