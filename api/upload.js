export const config = { runtime: 'edge' };

// ===== 腾讯云 COS 签名辅助函数（Web Crypto API，Edge 原生支持）=====

async function hmacSha1Hex(keyData, data) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        typeof keyData === 'string' ? new TextEncoder().encode(keyData) : keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha1Hex(data) {
    const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 将 base64 字符串转为 Uint8Array（Edge 没有 Node.js Buffer）
function base64ToUint8Array(base64) {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    return bytes;
}

// =====================================================================

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
        });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const { imageBase64 } = await req.json();
        if (!imageBase64) {
            return new Response(JSON.stringify({ error: '没有收到图片' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const secretId = process.env.COS_SECRET_ID;
        const secretKey = process.env.COS_SECRET_KEY;
        const bucket = process.env.COS_BUCKET;
        const region = process.env.COS_REGION;

        if (!secretId || !secretKey || !bucket || !region) {
            return new Response(JSON.stringify({ error: 'COS 环境变量未配置' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // 将 base64 转 Uint8Array
        const bodyBytes = base64ToUint8Array(imageBase64);

        const fileName = `hebao_images/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
        const host = `${bucket}.cos.${region}.myqcloud.com`;
        const cosPath = `/${fileName}`;

        // ---- 腾讯云 COS 签名（q-sign-algorithm=sha1）----
        const now = Math.floor(Date.now() / 1000);
        const keyTime = `${now};${now + 3600}`;

        // 第1步：SignKey = HMAC-SHA1(SecretKey, KeyTime)，结果为 hex
        const signKeyHex = await hmacSha1Hex(secretKey, keyTime);

        // 第2步：构造 HttpString（Method\nURI\nParams\nHeaders\n）
        // 参与签名的 headers（按字典序排列）：content-type, host
        const httpMethod = 'put';
        const urlParams = '';
        const signedHeaderKeys = 'content-type;host';
        const encodedHeaders = `content-type=image%2Fjpeg&host=${encodeURIComponent(host)}`;
        const httpString = `${httpMethod}\n${cosPath}\n${urlParams}\n${encodedHeaders}\n`;

        // 第3步：StringToSign = sha1 + \n + KeyTime + \n + SHA1(HttpString) + \n
        const httpStringHash = await sha1Hex(httpString);
        const stringToSign = `sha1\n${keyTime}\n${httpStringHash}\n`;

        // 第4步：Signature = HMAC-SHA1(SignKey, StringToSign)
        const signatureHex = await hmacSha1Hex(signKeyHex, stringToSign);

        const authorization = [
            `q-sign-algorithm=sha1`,
            `q-ak=${secretId}`,
            `q-sign-time=${keyTime}`,
            `q-key-time=${keyTime}`,
            `q-header-list=${signedHeaderKeys}`,
            `q-url-param-list=`,
            `q-signature=${signatureHex}`
        ].join('&');

        // ---- 上传到 COS ----
        const cosUrl = `https://${host}${cosPath}`;
        const uploadRes = await fetch(cosUrl, {
            method: 'PUT',
            headers: {
                'Host': host,
                'Content-Type': 'image/jpeg',
                'Authorization': authorization,
            },
            body: bodyBytes
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            return new Response(JSON.stringify({ error: '上传腾讯云失败', detail: errText }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const imageUrl = `https://${host}${cosPath}`;
        return new Response(JSON.stringify({ success: true, url: imageUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
