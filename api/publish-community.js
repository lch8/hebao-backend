// api/publish-community.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    // 1. 🛡️ 核心鉴权层 (防伪造发帖)
    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!authUserId) return new Response(JSON.stringify({ error: '请先登录或 Token 已过期' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const body = await req.json();
        const title = body.title || body.name || '';
        const content = body.content || body.text || body.desc || ''; 
        const authorName = body.author_name || body.authorName || '';
        const imageUrl = body.image_url || body.imageUrl || '';
        const likes = body.likes || 0; 
        
        // 🌟 接收前端传来的特权标识
        const isUrgent = body.isUrgent || false; 

        if (!title || !content) {
            return new Response(JSON.stringify({ error: '标题和正文不能为空哦！' }), { status: 400 });
        }

        let dbUrl = process.env.TURSO_DATABASE_URL; 
        const authToken = process.env.TURSO_AUTH_TOKEN; 
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '环境变量未配置！' }), { status: 500 }); 
        dbUrl = dbUrl.replace('libsql://', 'https://'); 

        const finalName = authorName && authorName.trim() !== '' ? authorName.trim() : '匿名管家' + Math.floor(Math.random() * 9999); 
        
        let sqlRequests = [];

        // ==================================================
        // 🚨 核心商业化：十万火急拦截与扣款
        // ==================================================
        if (isUrgent) {
            // 1. 先去数据库查这个人的积分够不够
            const checkRes = await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        { type: "execute", stmt: { sql: "SELECT points FROM users WHERE id = ?", args: [{type:"text", value: String(authUserId)}] } },
                        { type: "close" }
                    ]
                })
            });
            const pointsData = await checkRes.json();
            
            // 拦截查分报错 (比如 points 字段不存在)
            if (pointsData.results && pointsData.results[0].type === 'error') {
                throw new Error("查分失败: " + pointsData.results[0].error.message);
            }

            const rows = pointsData.results[0].response.result.rows;
            const currentPoints = (rows && rows.length > 0 && rows[0][0].value !== null) ? parseInt(rows[0][0].value) : 0;

            // 🌟 如果积分不够，直接拒绝执行
            if (currentPoints < 5) {
                return new Response(JSON.stringify({ success: false, error: "您的荷包币不足 5 点，无法使用【十万火急】特权哦！" }), { 
                    status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
                });
            }

            // 2. 积分足够，装载扣款 SQL
            sqlRequests.push({
                type: "execute",
                stmt: {
                    sql: "UPDATE users SET points = points - 5 WHERE id = ?",
                    args: [{type: "text", value: String(authUserId)}]
                }
            });
        }

        // ==================================================
        // 📦 插入新帖子 (兼容你原有的 SQL 结构)
        // ==================================================
        sqlRequests.push({ 
            type: "execute", 
            stmt: { 
                sql: "INSERT INTO community_posts (user_id, author_name, title, content, image_url, likes) VALUES (?, ?, ?, ?, ?, ?)", 
                args: [
                    { type: "text", value: String(authUserId) },
                    { type: "text", value: String(finalName) },
                    { type: "text", value: String(title) },
                    { type: "text", value: String(content) },
                    { type: "text", value: String(imageUrl) },
                    { type: "text", value: String(likes || 0) } 
                ]
            }
        });
        
        sqlRequests.push({ type: "close" }); 

        // 统一发车执行
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: sqlRequests })
        });

        if (!response.ok) throw new Error(`Turso 拒绝连接 (${response.status})`);

        const result = await response.json(); 
        
        // 防爆盾：遍历检查有没有 SQL 报错
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
