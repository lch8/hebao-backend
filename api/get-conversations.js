// api/get-conversations.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

// 🌟 新增邮箱脱敏引擎 (保护欧洲 GDPR 隐私)
function maskEmail(email) {
    if (!email || !email.includes('@')) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) return new Response(JSON.stringify({ error: '缺少用户ID' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 核心修改：使用 CTE 连表查询对方的邮箱和成交数
        const sql = `
            WITH LatestMsgs AS (
                SELECT 
                    CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id,
                    MAX(created_at) as last_time,
                    content as last_message
                FROM messages 
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY partner_id
            )
            SELECT l.*, u.verified_email as partner_email, u.deal_count as partner_deal_count 
            FROM LatestMsgs l
            LEFT JOIN users u ON l.partner_id = u.id
            ORDER BY l.last_time DESC
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
        
        // 🌟 数据组装与隐私脱敏
        const conversations = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => obj[cols[i]] = val.value);
            
            // 将查询到的真实邮箱打码，同时给成交数赋默认值
            obj.partner_email = maskEmail(obj.partner_email);
            obj.partner_deal_count = obj.partner_deal_count !== null ? parseInt(obj.partner_deal_count) : 0;
            
            return obj;
        });

        return new Response(JSON.stringify({ success: true, conversations }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
