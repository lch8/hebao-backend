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

        // 发送原生 HTTP 请求，并严格遵守 Turso 的数据类型标签格式 (Tagged Enum)
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
                            sql: "INSERT OR REPLACE INTO products (dutch_name, chinese_name, category, is_recommended, insight, pairing, warning) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                            // 💡 修复点：给每个数据贴上 type 标签，Turso 就能完美识别了！
                            args: [
                                { type: "text", value: String(data.dutch_name || "") },
                                { type: "text", value: String(data.chinese_name || "") },
                                { type: "text", value: String(data.category || "") },
                                { type: "integer", value: data.is_recommended ? "1" : "0" }, 
                                { type: "text", value: String(data.insight || "") },
                                { type: "text", value: String(data.pairing || "") },
                                { type: "text", value: String(data.warning || "") }
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
