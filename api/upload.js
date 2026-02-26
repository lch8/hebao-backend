import COS from 'cos-nodejs-sdk-v5';

export default async function handler(req, res) {
    // 允许跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '只允许 POST' });

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: '没有收到图片' });

        // 初始化腾讯云 COS
        const cos = new COS({
            SecretId: process.env.COS_SECRET_ID,
            SecretKey: process.env.COS_SECRET_KEY,
        });

        // 将 Base64 转换成文件流
        const buffer = Buffer.from(imageBase64, 'base64');
        // 生成一个唯一的文件名 (时间戳+随机数)
        const fileName = `hebao_images/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;

        // 执行上传动作
        cos.putObject({
            Bucket: process.env.COS_BUCKET,
            Region: process.env.COS_REGION,
            Key: fileName,
            Body: buffer,
            ContentType: 'image/jpeg',
        }, function(err, data) {
            if (err) {
                console.error("COS上传报错:", err);
                return res.status(500).json({ error: '上传腾讯云失败' });
            }
            // 拼装出图片在全网的永久访问链接！
            const imageUrl = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${fileName}`;
            return res.status(200).json({ success: true, url: imageUrl });
        });
    } catch (error) {
        return res.status(500).json({ error: '服务器内部错误' });
    }
}
