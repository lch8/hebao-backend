export const config = { runtime: 'edge' };

export default async function handler(req) {
    // 允许跨域
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });

    try {
        // 🌟 修复 Edge 环境下解析相对 URL 崩溃的 Bug
        const url = new URL(req.url, 'http://localhost');
        const category = url.searchParams.get('category') || '全部';

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken) {
            return new Response(JSON.stringify({ success: false, error: 'Vercel 缺少数据库环境变量' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        let sqlCondition = "";
        let args = [];
        if (category !== '全部') {
            sqlCondition = "WHERE category = ?";
            args = [{ type: "text", value: category }];
        }

        const tursoRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: `SELECT * FROM products ${sqlCondition} ORDER BY likes DESC LIMIT 20`, args: args } },
                    { type: "execute", stmt: { sql: `SELECT * FROM products ${sqlCondition} ORDER BY dislikes DESC LIMIT 20`, args: args } },
                    { type: "close" }
                ]
            })
        });

        if (!tursoRes.ok) {
            const errText = await tursoRes.text();
            throw new Error(`数据库查询失败: ${errText}`);
        }

        const tursoData = await tursoRes.json();
        
        const parseRows = (resultSet) => {
            if (!resultSet || !resultSet.rows) return [];
            const cols = resultSet.cols.map(c => c.name);
            return resultSet.rows.map(row => {
                const item = {};
                cols.forEach((col, i) => item[col] = row[i]?.value);
                return item;
            });
        };

        const topLikes = parseRows(tursoData.results?.[0]?.response?.result);
        const topDislikes = parseRows(tursoData.results?.[1]?.response?.result);

        return new Response(JSON.stringify({ success: true, topLikes, topDislikes }), {
            status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        // 把真实的报错原因吐给前端
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    }
}
