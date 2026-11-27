import { readDbImage } from './_image-store.js';
export const config = { runtime: 'edge' };

// Serves listing photos stored in the database fallback. IDs are random UUIDs and content
// never changes, so responses are cached aggressively by the browser and Vercel's CDN.
export default async function handler(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  try {
    const row = await readDbImage(id);
    if (!row) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } });
    const bytes = Uint8Array.from(atob(row.data_b64), c => c.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        'Content-Type': row.mime || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('delft image', error);
    return new Response('Image unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
