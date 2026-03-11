export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        const data = await req.json();
        
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken) {
            return new Response(JSON.stringify({ error: '服务器缺 Turso 钥匙！' }), { status: 500 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 发送原生 HTTP 请求，增加 barcode 字段！
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            // ⚠️ 重点：这里加了 barcode
                            sql: "INSERT OR REPLACE INTO products (dutch_name, chinese_name, category, is_recommended, insight, pairing, warning, alternatives, features, image_url, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            args: [ 
                                { type: "text", value: String(data.dutch_name || "") },
                                { type: "text", value: String(data.chinese_name || "") },
                                { type: "text", value: String(data.category || "") },
                                { type: "integer", value: data.is_recommended ? "1" : "0" }, 
                                { type: "text", value: String(data.insight || "").replace(/⚡️\(由数据库秒回\)/g, '').trim() }, 
                                { type: "text", value: String(data.pairing || "") },
                                { type: "text", value: String(data.warning || "") },
                                { type: "text", value: String(data.alternatives || "") },
                                { type: "text", value: String(data.features || "") },
                                { type: "text", value: String(data.image_url || "") },
                                { type: "text", value: String(data.barcode || "") } // 👈 新增的第11个参数
                            ] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const tursoResult = await response.json();

        if (!response.ok) {
            console.error("Turso 报错:", tursoResult);
            return new Response(JSON.stringify({ error: '存入数据库失败' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        return new Response(JSON.stringify({ success: true, message: '数据已永久收录！' }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
