// Legacy upload endpoint (used by the old ui.js). It used to accept anonymous uploads of any
// content straight into the COS bucket; it now requires login, JPEG input and shares the
// quota + COS→database fallback logic of /api/delft-upload.
import delftUpload from './delft-upload.js';
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return Response.json({ error: '只允许 POST' }, { status: 405 });
  const response = await delftUpload(req);
  const data = await response.json().catch(() => ({}));
  return Response.json(response.ok ? { success: true, url: data.url } : data, { status: response.status });
}
