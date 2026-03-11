import { NextResponse } from 'next/server';

// 需要鉴权的 API 路由（白名单）
const PROTECTED_PATHS = [
    '/api/vote',
    '/api/save',
    '/api/publish-community',
    '/api/like-community',
    '/api/delete-post',
    '/api/update-post',
    '/api/get-my-posts',
    '/api/upload',
    '/api/ask',
    '/api/magic-recipe',
    '/api/scan',
    '/api/scan-barcode',
];

export const config = {
    matcher: [
        '/api/vote',
        '/api/save',
        '/api/publish-community',
        '/api/like-community',
        '/api/delete-post',
        '/api/update-post',
        '/api/get-my-posts',
        '/api/upload',
        '/api/ask',
        '/api/magic-recipe',
        '/api/scan',
        '/api/scan-barcode',
    ],
};

// ========== JWT 验证（Web Crypto API，Edge 原生支持）==========
async function verifyJwt(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, sigB64] = parts;
        const data = `${headerB64}.${payloadB64}`;

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        // 将 base64url 转为标准 base64
        const sigStd = sigB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((sigB64.length + 2) % 4 || 4);
        const sigBytes = Uint8Array.from(atob(sigStd), c => c.charCodeAt(0));

        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
        if (!valid) return null;

        // 解码 payload
        const payloadStd = payloadB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((payloadB64.length + 2) % 4 || 4);
        const payload = JSON.parse(atob(payloadStd));

        // 检查过期时间
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

        return payload.userId;
    } catch {
        return null;
    }
}
// =============================================================

export default async function middleware(req) {
    // OPTIONS 预检请求直接放行
    if (req.method === 'OPTIONS') return NextResponse.next();

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return new Response(JSON.stringify({ error: '请先登录' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return new Response(JSON.stringify({ error: '服务器配置错误' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    const userId = await verifyJwt(token, jwtSecret);
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Token 无效或已过期，请重新登录' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // 将 userId 通过自定义 header 传递给下游 API handler
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-User-Id', userId);

    return NextResponse.next({
        request: { headers: requestHeaders }
    });
}
