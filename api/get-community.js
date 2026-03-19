// api/get-community.js
export const config = { runtime: 'edge' };

// 🛡️ 隐私脱敏引擎 (保护邮箱隐私)
function maskEmail(email) {
    if (!email || !email.includes('@')) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 🌟 核心：向 Turso 发起查询
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    // 🌟 强力排序：ORDER BY p.created_at DESC 确保新帖永远在最顶上！
                    { type: "execute", stmt: { sql: "SELECT p.id, p.author_name, p.image_url, p.title, p.content, p.likes, p.created_at, p.user_id, u.verified_email, u.credit FROM community_posts p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 50" } },                    
                    { type: "close" }
                ]
            }),
            cache: 'no-store' // 💥 关键一击：打穿 Vercel Edge 的强缓存限制！
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error("Turso报错: " + result.results[0].error.message);

        const resData = result.results[0].response.result;
        const cols = resData.cols.map(c => c.name);
        
        const posts = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => {
                let v = val.value;
                if (val.type === "integer") v = parseInt(v, 10);
                if (val.type === "null") v = null;
                obj[cols[i]] = v;
            });
            
            // 安全脱敏
            if (obj.verified_email) {
                obj.email = maskEmail(obj.verified_email);
                delete obj.verified_email;
            } else {
                obj.email = '';
            }
            obj.credit = obj.credit !== null && obj.credit !== undefined ? obj.credit : 100;
            return obj;
        });

        // 💥 关键二击：让浏览器也不要缓存！
        return new Response(JSON.stringify({ success: true, posts }), { 
            status: 200, 
            headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
}
