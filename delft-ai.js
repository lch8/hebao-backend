import { sql, json } from './_delft-db.js';
export const config = { runtime: 'edge' };

const strictJson = text => {
  try { return JSON.parse(text); }
  catch { throw new Error('识别结果格式异常，请重试或手动填写'); }
};

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error:'只支持 POST' },405);
  try {
    const { photos } = await request.json();
    if (!Array.isArray(photos) || photos.length<1 || photos.length>8 ||
        photos.some(photo=>typeof photo!=='string' || photo.length>800000 || !/^[A-Za-z0-9+/=]+$/.test(photo))) {
      return json({error:'请上传 1–8 张压缩后的 JPG 照片'},400);
    }
    if (!process.env.GEMINI_API_KEY || !process.env.JWT_SECRET) return json({error:'AI 服务暂未配置，仍可手动发布'},503);

    // Hash the (short-lived) IP/day tuple, avoiding storage of raw IP addresses.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const day = new Date().toISOString().slice(0,10);
    const input = new TextEncoder().encode(`${day}:${ip}:${process.env.JWT_SECRET}`);
    const digest = await crypto.subtle.digest('SHA-256',input);
    const key = [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    await sql('CREATE TABLE IF NOT EXISTS delft_ai_quota (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');
    const quota = await sql(`INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
      ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<8 RETURNING hits`,[key]);
    if (!quota.rows.length) return json({error:'今天 AI 识别次数已用完，可手动编辑商品'},429);

    const parts = [{text:`请按照片顺序识别中国留学生出售的二手物品，输出严格 JSON。
每张照片对应一个商品，不要合并。仅识别可见事实，不要猜品牌、成色、价格或缺陷。
返回格式：{"items":[{"index":0,"name":"中文商品名","condition":"照片中能证实的简单描述，不确定则空字符串"}]}。
index 从0开始，正好返回 ${photos.length} 件，名称简短。不要任何其他文本。`}];
    photos.forEach(photo=>parts.push({inlineData:{mimeType:'image/jpeg',data:photo}}));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        contents:[{parts}],generationConfig:{responseMimeType:'application/json',temperature:0.1}
      })
    });
    if (!response.ok) throw new Error('AI 服务暂时不可用');
    const data=await response.json();
    const raw=data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('AI 没有返回有效商品信息');
    const parsed=strictJson(raw);
    const items=(Array.isArray(parsed.items)?parsed.items:[]).filter(i=>Number.isInteger(i.index)&&i.index>=0&&i.index<photos.length)
      .map(i=>({index:i.index,name:String(i.name||'物品').slice(0,70),condition:String(i.condition||'').slice(0,140)}));
    return json({items});
  } catch(error) {
    console.error('delft ai',error);
    return json({error:'识别暂时失败，可手动填写商品信息'},500);
  }
}
