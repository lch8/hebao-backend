// api/publish-community.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    // 1. 严格保安：JWT 鉴权
    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!authUserId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        // 2. 宽容大度：全面兼容前端发来的各种字段组合
        const body = await req.json();
        const title = body.title || body.name || '';
        // 兼容前端的 content 或 text
        const content = body.content || body.text || body.desc || ''; 
        const authorName = body.author_name || body.authorName || '';
        const imageUrl = body.image_url || body.imageUrl || '';
        const likes = body.likes || 0; // 🌟 关键修复：接收前端传来的商品价格！

        if (!title || !content) {
            return new Response(JSON.stringify({ error: '标题和正文不能为空哦！' }), { status: 400 });
        }

        let dbUrl = process.env.TURSO_DATABASE_URL; 
        const authToken = process.env.TURSO_AUTH_TOKEN; 
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '环境变量未配置！' }), { status: 500 }); 
        dbUrl = dbUrl.replace('libsql://', 'https://'); 

        const finalName = authorName && authorName.trim() !== ''
            ? authorName.trim()
            : '匿名管家' + Math.floor(Math.random() * 9999); 

        // 🌟 3. 核心修复：SQL 语句增加 likes 字段，彻底堵住价格丢失漏洞！
        const sql = `INSERT INTO community_posts (user_id, author_name, title, content, image_url, likes) VALUES (?, ?, ?, ?, ?, ?)`; 

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sql, args: [
                        { type: "text", value: String(authUserId) },
                        { type: "text", value: String(finalName) },
                        { type: "text", value: String(title) },
                        { type: "text", value: String(content) },
                        { type: "text", value: String(imageUrl) },
                        { type: "integer", value: Number(likes) } // 把价格稳稳地存进去
                    ]}}, 
                    { type: "close" } 
                ]
            })
        });

        const result = await response.json(); 
        if (result.results[0].type === 'error') throw new Error("Turso数据库拒收: " + result.results[0].error.message); 

        return new Response(JSON.stringify({ success: true, message: '发布成功！' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); 
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); 
    }
}
