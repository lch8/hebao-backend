// api/publish-community.js
import { verifyJwt } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    const token = req.headers.get('Authorization')?.slice(7);
    const authUserId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!authUserId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const body = await req.json();
        const title = body.title || body.name || '';
        const content = body.content || body.text || body.desc || ''; 
        const authorName = body.author_name || body.authorName || '';
        const imageUrl = body.image_url || body.imageUrl || '';
        const likes = body.likes || 0; 

        if (!title || !content) {
            return new Response(JSON.stringify({ error: '标题和正文不能为空哦！' }), { status: 400 });
        }

        let dbUrl = process.env.TURSO_DATABASE_URL; 
        const authToken = process.env.TURSO_AUTH_TOKEN; 
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '环境变量未配置！' }), { status: 500 }); 
        dbUrl = dbUrl.replace('libsql://', 'https://'); 

        const finalName = authorName && authorName.trim() !== '' ? authorName.trim() : '匿名管家' + Math.floor(Math.random() * 9999); 

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
                        { type: "text", value: String(likes || 0) } // ✅ 终极防爆：强行转成字符串，彻底绕过类型校验！
                        ]}}, 
                    { type: "close" } 
                ]
            })
        });

        // 🌟 终极照妖镜：先看 HTTP 状态码对不对！
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Turso 拒绝连接 (${response.status}): ${errorText}`);
        }

        const result = await response.json(); 
        
        // 🌟 防爆盾：检查 Turso 是否返回了非预期的格式
        if (result.message || result.error) {
            throw new Error(`Turso 报错: ${result.message || result.error}`);
        }
        if (!result.results || !result.results[0]) {
            throw new Error(`Turso 返回格式异常: ${JSON.stringify(result)}`);
        }
        
        // 🌟 拦截 SQL 级别的错误（比如表不存在、字段名写错）
        if (result.results[0].type === 'error') {
            throw new Error(`Turso SQL 报错: ${result.results[0].error.message}`);
        }

        return new Response(JSON.stringify({ success: true, message: '发布成功！' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); 
    } catch (error) {
        // 把真实的错误原因直接扔给前端
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); 
    }
}
