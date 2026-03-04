import { createClient } from '@libsql/client/web';

export default async function handler(req, res) {
    // 1. 设置跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只允许 POST 请求' });
    }

    try {
        // 🚨 核心修复：Nodejs 下直接读 req.body，千万不能用 await req.json()
        const { userId, title, text, imageUrl } = req.body;

        if (!title || !text) {
            return res.status(400).json({ error: '标题和做法不能为空哦！' });
        }

        // 连接数据库
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // 随机生成名字
        const adjectives = ['阿姆', '鹿特丹', '代尔夫特', '乌村', '海牙', '省钱', '深夜', '狂暴'];
        const nouns = ['厨神', '干饭人', '食神', '饿狼', '大明白', '评测员'];
        const randomName = adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)];

        // 存入数据库
        await client.execute({
            sql: `INSERT INTO community_posts (user_id, author_name, title, content, image_url) VALUES (?, ?, ?, ?, ?)`,
            args: [userId || 'unknown-user', randomName, title, text, imageUrl || '']
        });

        // 🚨 核心修复：Nodejs 下的返回语法 res.status().json()
        return res.status(200).json({ success: true, message: '发布成功！' });

    } catch (error) {
        console.error('Publish Error:', error);
        return res.status(500).json({ error: '数据库开小差了，发布失败' });
    }
}
