// api/get-community.js
export const config = { runtime: 'edge' };

// 🛡️ 隐私脱敏引擎 
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
        if (!dbUrl) throw new Error("Vercel 环境变量缺失: TURSO_DATABASE_URL");
        dbUrl = dbUrl.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 🌟 防爆修复：使用 p.* 兼容所有字段；强制转换 id 类型防止匹配失败
const sql = "SELECT p.*, u.deal_count FROM community_posts p LEFT JOIN users u ON p.user_id = CAST(u.id AS TEXT) ORDER BY p.created_at DESC LIMIT 50";
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

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Turso 拒绝连接 (${response.status}): ${text}`);
        }

        const result = await response.json();
        
        // 拦截 Turso 底层 SQL 报错 (比如哪一列不存在)
        if (result.results && result.results[0].type === 'error') {
            throw new Error(`Turso SQL 报错: ${result.results[0].error.message}`);
        }

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
            
            if (obj.verified_email) {
                obj.email = maskEmail(obj.verified_email);
                delete obj.verified_email;
            } else {
                obj.email = '';
            }
            obj.deal_count = obj.deal_count !== null && obj.deal_count !== undefined ? obj.deal_count : 0;
            return obj;
        });

        return new Response(JSON.stringify({ success: true, posts }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
        });
    } catch (error) {
        // 🚨 终极大招：故意返回 HTTP 200，但把真凶的名字装进 JSON 传给前端！
        return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        });
    }
}
