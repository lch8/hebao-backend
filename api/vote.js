export const config = {
    runtime: 'edge',
};

async function verifyJwt(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, sigB64] = parts;
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const sigStd = sigB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((sigB64.length + 2) % 4 || 4);
        const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(sigStd), c => c.charCodeAt(0)), new TextEncoder().encode(`${headerB64}.${payloadB64}`));
        if (!valid) return null;
        const payloadStd = payloadB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((payloadB64.length + 2) % 4 || 4);
        const payload = JSON.parse(atob(payloadStd));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload.userId;
    } catch { return null; }
}

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    const token = req.headers.get('Authorization')?.slice(7);
    const userId = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
    if (!userId) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    try {
        const { dutch_name, action } = await req.json();

        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken || !dutch_name || !action) {
            return new Response(JSON.stringify({ error: '参数缺失或无数据库钥匙' }), { status: 400 });
        }

        // 白名单校验，防止任何形式的 SQL 注入
        if (action !== 'like' && action !== 'dislike') {
            return new Response(JSON.stringify({ error: '非法的 action 参数' }), { status: 400 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 用独立参数化 SQL，彻底避免列名字符串拼接
        let sql;
        if (action === 'like') {
            sql = 'UPDATE products SET likes = COALESCE(likes, 0) + 1 WHERE dutch_name = ?';
        } else {
            sql = 'UPDATE products SET dislikes = COALESCE(dislikes, 0) + 1 WHERE dutch_name = ?';
        }

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

        if (!response.ok) throw new Error("Turso 计分失败");

        return new Response(JSON.stringify({ success: true, message: '投票成功！' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}

        
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken || !dutch_name || !action) {
            return new Response(JSON.stringify({ error: '参数缺失或无数据库钥匙' }), { status: 400 });
        }

        // 白名单校验，防止任何形式的 SQL 注入
        if (action !== 'like' && action !== 'dislike') {
            return new Response(JSON.stringify({ error: '非法的 action 参数' }), { status: 400 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 用独立参数化 SQL，彻底避免列名字符串拼接
        let sql;
        if (action === 'like') {
            sql = 'UPDATE products SET likes = COALESCE(likes, 0) + 1 WHERE dutch_name = ?';
        } else {
            sql = 'UPDATE products SET dislikes = COALESCE(dislikes, 0) + 1 WHERE dutch_name = ?';
        }

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
