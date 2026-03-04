import { createClient } from '@libsql/client/web';



export default async function handler(req) {
    // 1. 处理跨域
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        const { userId, title, text, imageUrl } = await req.json();

        if (!title || !text) {
            return new Response(JSON.stringify({ error: '标题和做法不能为空哦！' }), { status: 400 });
        }

        // 2. 连接 Turso 数据库
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // 3. 随机生成一个霸气的作者名（因为咱们还没做用户名系统）
        const adjectives = ['阿姆', '鹿特丹', '代尔夫特', '乌村', '海牙', '省钱', '深夜', '狂暴'];
        const nouns = ['厨神', '干饭人', '食神', '饿狼', '大明白', '评测员'];
        const randomName = adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)];

        // 4. 将帖子插入数据库
        await client.execute({
            sql: `INSERT INTO community_posts (user_id, author_name, title, content, image_url) VALUES (?, ?, ?, ?, ?)`,
            args: [userId || 'unknown-user', randomName, title, text, imageUrl || '']
        });

        return new Response(JSON.stringify({ success: true, message: '发布成功！' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Publish Error:', error);
        return new Response(JSON.stringify({ error: '数据库开小差了，发布失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
