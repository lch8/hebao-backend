export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        // action 只能是 'like' 或 'dislike'
        const { dutch_name, action } = await req.json();
        
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken || !dutch_name || !action) {
            return new Response(JSON.stringify({ error: '参数缺失或无数据库钥匙' }), { status: 400 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');
        
        // 动态决定给哪个字段加 1 (COALESCE 是为了防止旧数据是 NULL 时加不了 1)
        const column = action === 'like' ? 'likes' : 'dislikes';
        const sql = `UPDATE products SET ${column} = COALESCE(${column}, 0) + 1 WHERE dutch_name = ?`;

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
                            sql: sql, 
                            args: [{ type: "text", value: String(dutch_name) }] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const tursoResult = await response.json();
        if (!response.ok) throw new Error("Turso 计分失败");

        return new Response(JSON.stringify({ success: true, message: '投票成功！' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
