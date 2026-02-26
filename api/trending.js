export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: '只允许 GET 请求' }), { status: 405 });
    }

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken) {
            return new Response(JSON.stringify({ error: '数据库配置缺失' }), { status: 500 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');
        
        // 核心 SQL：分别提取点赞前 15 名和踩雷前 15 名
        const sqlLikes = `SELECT dutch_name, chinese_name, insight, likes FROM products WHERE likes > 0 ORDER BY likes DESC LIMIT 15`;
        const sqlDislikes = `SELECT dutch_name, chinese_name, insight, dislikes FROM products WHERE dislikes > 0 ORDER BY dislikes DESC LIMIT 15`;

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: sqlLikes } },
                    { type: "execute", stmt: { sql: sqlDislikes } },
                    { type: "close" }
                ]
            })
        });

        if (!response.ok) throw new Error("数据库查询失败");

        const data = await response.json();
        
        // 解析 Turso 返回的复杂数据格式
        const formatRows = (resultObj) => {
            if(!resultObj || !resultObj.response || !resultObj.response.result) return [];
            const cols = resultObj.response.result.cols.map(c => c.name);
            return resultObj.response.result.rows.map(row => {
                let obj = {};
                row.forEach((val, i) => obj[cols[i]] = val.value);
                return obj;
            });
        };

        const topLikes = formatRows(data.results[0]);
        const topDislikes = formatRows(data.results[1]);

        return new Response(JSON.stringify({ success: true, topLikes, topDislikes }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
