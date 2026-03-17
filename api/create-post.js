// api/create-post.js
import { createClient } from '@libsql/client';
import COS from 'cos-nodejs-sdk-v5';

// 1. 初始化腾讯云 COS
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
});

// 2. 初始化 Turso 数据库
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { title, desc, author, avatar, images, type } = req.body;
        let imageUrls = [];

        // 解析前端传过来的 Base64 图片数组
        const base64Images = JSON.parse(images || '[]');

        // 3. 循环将 Base64 上传到腾讯云 COS
        for (let i = 0; i < base64Images.length; i++) {
            const base64Str = base64Images[i];
            const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            // 提取扩展名并生成随机文件名
            const extMatch = base64Str.match(/^data:image\/(\w+);base64,/);
            const ext = extMatch ? extMatch[1] : 'jpeg';
            const fileName = `market_posts/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

            // 上传到 COS
            await new Promise((resolve, reject) => {
                cos.putObject({
                    Bucket: process.env.COS_BUCKET,
                    Region: process.env.COS_REGION,
                    Key: fileName,
                    Body: buffer,
                }, (err, data) => {
                    if (err) reject(err);
                    else {
                        // 拼装出公网可访问的图片 URL
                        const publicUrl = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${fileName}`;
                        imageUrls.push(publicUrl);
                        resolve();
                    }
                });
            });
        }

        // 4. 图片搞定后，将全部数据存入 Turso 数据库
        const postId = 'post_' + Date.now();
        await db.execute({
            sql: 'INSERT INTO posts (id, title, desc, author, avatar, images, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            args: [postId, title, desc, author, avatar, JSON.stringify(imageUrls), type || 'question', Date.now()]
        });

        // 大功告成，返回成功信号
        res.status(200).json({ success: true, postId });
    } catch (error) {
        console.error("发帖失败:", error);
        res.status(500).json({ error: error.message });
    }
}
