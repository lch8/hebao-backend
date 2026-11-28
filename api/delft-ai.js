import { authId, sql, json } from './_delft-db.js';
export const config = { runtime: 'edge' };

const strictJson = text => {
  try { return JSON.parse(text); }
  catch { throw new Error('识别结果格式异常，请重试或手动填写'); }
};

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: '只支持 POST' }, 405);
  const user = await authId(request);
  if (!user) {
    return json({ error: '请先邮箱登录后使用 AI 识图，也可直接手动填写商品名称' }, 401);
  }
  try {
    let body;
    try { body = await request.json(); } catch { return json({ error: '请求格式有误' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: '请求格式有误' }, 400);
    }

    const mode = body.mode === 'a2_write' ? 'a2_write' : 'photos';

    if (mode === 'a2_write') {
      const prompt = String(body.prompt || '').trim().slice(0, 600);
      const context = String(body.context || '').trim().slice(0, 800);
      const answer = String(body.answer || '').trim().slice(0, 2000);
      const model = String(body.model || '').trim().slice(0, 1200);
      const checks = Array.isArray(body.checks)
        ? body.checks.map(c => String(c || '').trim().slice(0, 140)).filter(Boolean).slice(0, 5)
        : [];
      if (prompt.length < 5 || answer.length < 2 || !checks.length) {
        return json({ error: '请先写下你的荷兰语作答再进行 AI 批改' }, 400);
      }
      if (!process.env.GEMINI_API_KEY || !process.env.JWT_SECRET) {
        return json({ error: 'AI 批改服务暂未配置，可先对照范文自查' }, 503);
      }

      const day = new Date().toISOString().slice(0, 10);
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const [ipKey, userKey] = await Promise.all([
        sha256Hex(`${day}:a2write:ip:${ip}:${process.env.JWT_SECRET}`),
        sha256Hex(`${day}:a2write:user:${user}:${process.env.JWT_SECRET}`),
      ]);
      const globalKey = `${day}:global`;
      const dailyCap = Math.max(10, Number(process.env.GEMINI_DAILY_LIMIT) || 300);

      await sql('CREATE TABLE IF NOT EXISTS delft_ai_quota (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');
      const globalQuota = await sql(
        `INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
         ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<? RETURNING hits`,
        [globalKey, dailyCap]
      );
      if (!globalQuota.rows.length) {
        return json({ error: '今日全站免费 AI 额度已用完，请明天再试或对照范文自查' }, 429);
      }
      const [userQuota, ipQuota] = await Promise.all([
        sql(`INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
             ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<15 RETURNING hits`, [userKey]),
        sql(`INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
             ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<25 RETURNING hits`, [ipKey]),
      ]);
      if (!userQuota.rows.length || !ipQuota.rows.length) {
        return json({ error: '今天 AI 写作批改次数已用完（每日 15 次），可先对照范文自查' }, 429);
      }

      const instruction = `你是一位严谨、友善的荷兰语 DUO Inburgering A2 写作（Schrijven）考官。请用简洁中文批改考生的荷兰语作答，严格输出 JSON，不要输出任何额外文本。

【题目情境】
${context || '（无额外情境）'}

【写作任务】
${prompt}

【必须覆盖的得分要点（共 ${checks.length} 条）】
${checks.map((c, idx) => `${idx + 1}. ${c}`).join('\n')}
${model ? `\n【参考范文（仅作难度标尺）】\n${model}` : ''}

【考生作答】
${answer}

请按以下严格 JSON Schema 返回：
{
  "verdict": "pass" | "almost" | "needs_work",
  "summary": "1-2句简明中文总评：肯定写对的部分，并指出最影响得分的1个问题",
  "checks": [
    {"check": "原要点文案", "met": true, "note": "简短中文说明（25字以内）"}
  ],
  "corrections": [
    {"original": "考生有误或生硬的荷语片段", "better": "更自然的A2荷语改法", "reason": "简短中文语法原因，如动词第二位/de与het/拼写"}
  ],
  "rewrite": "尽量贴近考生原意的自然A2荷兰语改写版（严禁使用B2/C1难词或复杂从句）"
}

评判规则：
1. checks 数组长度必须严格等于 ${checks.length}，逐条对应上述得分要点；
2. 只要考生用可理解的 A2 荷兰语清晰传达了全部要点，即使有轻微拼写/冠词小错，也可以给 "pass" 或 "almost"；漏掉关键要点或意思让人难以理解则给 "needs_work"；
3. corrections 最多 4 条，只挑最关键的语法、词序或拼写问题；如果没有明显错误可返回空数组 []。`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });
      if (!response.ok) throw new Error('AI 批改服务暂时不可用');
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('AI 未返回有效批改结果');
      const parsed = strictJson(raw);
      const validVerdicts = new Set(['pass', 'almost', 'needs_work']);
      const checkedList = checks.map((label, idx) => {
        const entry = Array.isArray(parsed.checks) ? parsed.checks[idx] : null;
        return {
          check: label,
          met: Boolean(entry?.met),
          note: String(entry?.note || '').trim().slice(0, 120),
        };
      });
      const corrections = (Array.isArray(parsed.corrections) ? parsed.corrections : [])
        .filter(c => c && typeof c === 'object' && (c.original || c.better))
        .slice(0, 4)
        .map(c => ({
          original: String(c.original || '').trim().slice(0, 180),
          better: String(c.better || '').trim().slice(0, 180),
          reason: String(c.reason || '').trim().slice(0, 140),
        }));
      return json({
        grade: {
          verdict: validVerdicts.has(parsed.verdict) ? parsed.verdict : (checkedList.every(c => c.met) ? 'almost' : 'needs_work'),
          summary: String(parsed.summary || '').trim().slice(0, 260) || '已完成 A2 要点核对，请查看逐项反馈。',
          checks: checkedList,
          corrections,
          rewrite: String(parsed.rewrite || '').trim().slice(0, 1200),
        },
      });
    }

    const { photos } = body;
    if (!Array.isArray(photos) || photos.length < 1 || photos.length > 8 ||
        photos.some(photo => typeof photo !== 'string' || photo.length > 800000 || !/^[A-Za-z0-9+/=]+$/.test(photo))) {
      return json({ error: '请上传 1–8 张压缩后的 JPG 照片' }, 400);
    }
    if (!process.env.GEMINI_API_KEY || !process.env.JWT_SECRET) {
      return json({ error: 'AI 服务暂未配置，仍可手动发布' }, 503);
    }

    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const [ipKey, userKey] = await Promise.all([
      sha256Hex(`${day}:ip:${ip}:${process.env.JWT_SECRET}`),
      sha256Hex(`${day}:user:${user}:${process.env.JWT_SECRET}`),
    ]);
    const globalKey = `${day}:global`;
    const dailyCap = Math.max(10, Number(process.env.GEMINI_DAILY_LIMIT) || 300);

    await sql('CREATE TABLE IF NOT EXISTS delft_ai_quota (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');

    // 1. Global daily budget circuit breaker
    const globalQuota = await sql(
      `INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
       ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<? RETURNING hits`,
      [globalKey, dailyCap]
    );
    if (!globalQuota.rows.length) {
      return json({ error: '今日全站免费 AI 识图额度已用完，请直接手动填写商品名称' }, 429);
    }

    // 2. Per-user (10/day) and per-IP (15/day) rate limits
    const [userQuota, ipQuota] = await Promise.all([
      sql(`INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
           ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<10 RETURNING hits`, [userKey]),
      sql(`INSERT INTO delft_ai_quota(id,hits) VALUES(?,1)
           ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<15 RETURNING hits`, [ipKey]),
    ]);
    if (!userQuota.rows.length || !ipQuota.rows.length) {
      return json({ error: '今天 AI 识别次数已用完，可手动编辑商品' }, 429);
    }

    const parts = [{ text: `请按照片顺序识别中国留学生出售的二手物品，输出严格 JSON。
每张照片对应一个商品，不要合并。仅识别可见事实，不要猜品牌、成色、价格或缺陷。
返回格式：{"items":[{"index":0,"name":"中文商品名","condition":"照片中能证实的简单描述，不确定则空字符串"}]}。
index 从0开始，正好返回 ${photos.length} 件，名称简短。不要任何其他文本。` }];
    photos.forEach(photo => parts.push({ inlineData: { mimeType: 'image/jpeg', data: photo } }));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    });
    if (!response.ok) throw new Error('AI 服务暂时不可用');
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('AI 没有返回有效商品信息');
    const parsed = strictJson(raw);
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .filter(i => Number.isInteger(i.index) && i.index >= 0 && i.index < photos.length)
      .map(i => ({ index: i.index, name: String(i.name || '物品').slice(0, 70), condition: String(i.condition || '').slice(0, 140) }));
    return json({ items });
  } catch (error) {
    console.error('delft ai', error);
    return json({ error: 'AI 服务暂时不可用，请稍后重试' }, 500);
  }
}
