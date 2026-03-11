// api/_auth.js - 共享 JWT 验证工具（直接在每个 API 文件内 inline 使用）
// Vercel Edge Functions 不支持 Next.js middleware，鉴权逻辑内联到各文件

export async function verifyJwt(token, secret) {
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

        const sigStd = sigB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((sigB64.length + 2) % 4 || 4);
        const sigBytes = Uint8Array.from(atob(sigStd), c => c.charCodeAt(0));

        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
        if (!valid) return null;

        const payloadStd = payloadB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((payloadB64.length + 2) % 4 || 4);
        const payload = JSON.parse(atob(payloadStd));

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

        return payload.userId;
    } catch {
        return null;
    }
}

export function unauthorized(message = '请先登录') {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
}
