// api/get-community.js
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
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '配置缺失' }), { status: 500 });
        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 🌟 核心修改：在 SQL 中加入 u.credit 查询
        const sql = `
            SELECT p.id, p.author_name, p.image_url, p.title, p.content, p.likes, p.created_at, p.user_id, u.verified_email, u.credit 
            FROM community_posts p 
            LEFT JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC LIMIT 50
        `;

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sql } },                    
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        
        if (result.results[0].type === 'error') {
            throw new Error("Turso数据库报错: " + result.results[0].error.message);
        }

        const resData = result.results[0].response.result;
        const cols = resData.cols.map(c => c.name);
        
        // 🌟 数据组装与隐私脱敏
        const posts = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => {
                let v = val.value;
                if (val.type === "integer") v = parseInt(v, 10);
                if (val.type === "null") v = null;
                obj[cols[i]] = v;
            });
            
            // 将邮箱脱敏后赋值给 obj.email (前端代码期待取这个字段)
            if (obj.verified_email) {
                obj.email = maskEmail(obj.verified_email);
                delete obj.verified_email; // 删掉明文避免外泄
            } else {
                obj.email = '';
            }
            
            obj.credit = obj.credit !== null && obj.credit !== undefined ? obj.credit : 100;
            
            return obj;
        });

        return new Response(JSON.stringify({ success: true, posts }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
}
