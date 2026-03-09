export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    try {
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        if (!dbUrl || !authToken) return new Response(JSON.stringify({ error: '配置缺失' }), { status: 500 });
        dbUrl = dbUrl.replace('libsql://', 'https://');

        // ⚠️ 核心修复：SELECT 语句中强制拉取 alternatives(平替) 和 pairing(点评)！
        const sqlLikes = "SELECT id, dutch_name, chinese_name, category, insight, alternatives, pairing, warning, image_url, likes, dislikes FROM products ORDER BY likes DESC LIMIT 20";
        const sqlDislikes = "SELECT id, dutch_name, chinese_name, category, insight, alternatives, pairing, warning, image_url, likes, dislikes FROM products ORDER BY dislikes DESC LIMIT 20";

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sqlLikes } },
                    { type: "execute", stmt: { sql: sqlDislikes } },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error(result.results[0].error.message);

        // 数据格式化洗牌
        const formatRows = (resData) => {
            const cols = resData.cols.map(c => c.name);
            return resData.rows.map(row => {
                let obj = {};
                row.forEach((val, i) => obj[cols[i]] = val.value);
                return obj;
            });
        };

        const topLikes = formatRows(result.results[0].response.result);
        const topDislikes = formatRows(result.results[1].response.result);

        return new Response(JSON.stringify({ success: true, topLikes, topDislikes }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
