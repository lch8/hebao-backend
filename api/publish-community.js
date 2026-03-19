// api/publish-community.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    const token = req.headers.get('Authorization')?.slice(7);
    const authPayload = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    
    const realUserId = authPayload ? (authPayload.userId || authPayload) : null;
    if (!realUserId) return new Response(JSON.stringify({ error: '请先登录或 Token 已过期' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const body = await req.json();
        const title = body.title || body.name || '';
        const content = body.content || body.text || body.desc || ''; 
        const authorName = body.author_name || body.authorName || '';
        const imageUrl = body.image_url || body.imageUrl || '';
        const likes = body.likes || 0; 
        const isUrgent = body.isUrgent || false; 

        if (!title || !content) return new Response(JSON.stringify({ error: '标题和正文不能为空哦！' }), { status: 400 });

        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://'); 
        const authToken = process.env.TURSO_AUTH_TOKEN; 

        const finalName = authorName && authorName.trim() !== '' ? authorName.trim() : '匿名管家' + Math.floor(Math.random() * 9999); 
        
        // 记录当前精准时间戳，保证帖子不沉底
        const now = new Date().toISOString();

        let sqlRequests = [];

        // 🚨 核心商业化：十万火急拦截与扣款
        if (isUrgent) {
            const checkRes = await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        { type: "execute", stmt: { sql: "SELECT points FROM users WHERE id = ?", args: [{type:"text", value: String(realUserId)}] } },
                        { type: "close" }
                    ]
                })
            });
            const pointsData = await checkRes.json();
            if (pointsData.results && pointsData.results[0].type === 'error') throw new Error("查分失败: " + pointsData.results[0].error.message);

            const rows = pointsData.results[0].response.result.rows;
            const currentPoints = (rows && rows.length > 0 && rows[0][0].value !== null) ? parseInt(rows[0][0].value) : 0;

            if (currentPoints < 5) {
                return new Response(JSON.stringify({ success: false, error: "您的荷包币不足 5 点，无法使用【十万火急】特权哦！" }), { 
                    status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
                });
            }

            sqlRequests.push({
                type: "execute",
                stmt: {
                    sql: "UPDATE users SET points = points - 5 WHERE id = ?",
                    args: [{type: "text", value: String(realUserId)}]
                }
            });
        }

        // ==========================================================
        // 📦 插入新帖子 (💥 核心修复区：移除了自定义 ID)
        // ==========================================================
        sqlRequests.push({ 
            type: "execute", 
            stmt: { 
                // 只保留这 7 个字段，id 由数据库自动分配
                sql: "INSERT INTO community_posts (user_id, author_name, title, content, image_url, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                args: [
                    { type: "text", value: String(realUserId) },
                    { type: "text", value: String(finalName) },
                    { type: "text", value: String(title) },
                    { type: "text", value: String(content) },
                    { type: "text", value: String(imageUrl) },
                    
                    // 金额必须是 integer 且套上 String，这是 Turso Hrana API 的死规定
                    { type: "integer", value: String(parseInt(likes) || 0) }, 
                    
                    // 填入刚刚生成的时间，防止页面查不到
                    { type: "text", value: now } 
                ]
            }
        });
        
        sqlRequests.push({ type: "close" }); 

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: sqlRequests })
        });

        if (!response.ok) {
            const errTxt = await response.text();
            throw new Error(`Turso 拒绝连接 (${response.status}): ${errTxt}`);
        }

        const result = await response.json(); 
        if (result.results) {
            for (let r of result.results) {
                if (r.type === 'error') throw new Error(`Turso SQL 报错: ${r.error.message}`);
            }
        }

        return new Response(JSON.stringify({ success: true, message: '发布成功！' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); 
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); 
    }
}
