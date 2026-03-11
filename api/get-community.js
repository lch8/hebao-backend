export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '配置缺失' }), { status: 500 });
        dbUrl = dbUrl.replace('libsql://', 'https://');

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "SELECT id, author_name, image_url, title, content, likes, created_at FROM community_posts ORDER BY created_at DESC LIMIT 50" } },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        
        // 🚨 照妖镜：拦截 Turso 内部的 SQL 报错！
        if (result.results[0].type === 'error') {
            throw new Error("Turso数据库报错: " + result.results[0].error.message);
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
            return obj;
        });

        return new Response(JSON.stringify({ success: true, posts }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
}
