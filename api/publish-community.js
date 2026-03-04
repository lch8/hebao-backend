import { createClient } from '@libsql/client/web';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '只允许 POST' });

    try {
        // 🚨 探针 1：打印接收到的前端数据
        console.log("1. 接收到前端数据:", req.body);
        const { userId, title, text, imageUrl } = req.body;

        if (!title || !text) {
            return res.status(400).json({ error: '标题和做法不能为空哦！' });
        }

        // 🚨 探针 2：打印服务器实际读到的环境变量（脱敏处理密码）
        const dbUrl = process.env.TURSO_DATABASE_URL;
        const dbToken = process.env.TURSO_AUTH_TOKEN;
        console.log("2. 读取到的 URL 是:", dbUrl);
        console.log("3. 读取到的 Token 前五位是:", dbToken ? dbToken.substring(0, 5) : '找不到Token!');

        // 如果 URL 不存在或者不是 libsql/https 开头，直接拦截并报错
        if (!dbUrl || (!dbUrl.startsWith('libsql://') && !dbUrl.startsWith('https://'))) {
            return res.status(500).json({ error: `环境变量配置错误，当前URL为: ${dbUrl}` });
        }

        const client = createClient({ url: dbUrl, authToken: dbToken });

        const randomName = '野生大厨' + Math.floor(Math.random() * 9999);

        await client.execute({
            sql: `INSERT INTO community_posts (user_id, author_name, title, content, image_url) VALUES (?, ?, ?, ?, ?)`,
            args: [userId || 'unknown', randomName, title, text, imageUrl || '']
        });

        return res.status(200).json({ success: true, message: '发布成功！' });

    } catch (error) {
        // 🚨 探针 3：打印真实崩溃日志
        console.error('致命崩溃:', error);
        return res.status(500).json({ error: error.message });
    }
}
