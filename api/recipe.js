export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });
    }

    try {
        const { dutch_name, recipe } = await req.json();
        
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken || !dutch_name || !recipe) {
            return new Response(JSON.stringify({ error: '参数缺失' }), { status: 400 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');
        
        // 核心 SQL：把用户的新吃法，用换行符拼接到原来的 pairing 后面！
        // COALESCE 保证就算原来是 NULL，也不会报错
        const sql = `UPDATE products SET pairing = COALESCE(pairing, '') || '\n\n' || ? WHERE dutch_name = ?`;

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
                            args: [{ type: "text", value: String(recipe) }, { type: "text", value: String(dutch_name) }] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        if (!response.ok) throw new Error("数据库写入失败");

        return new Response(JSON.stringify({ success: true, message: '神仙吃法收录成功！' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
