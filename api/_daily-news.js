// Automated daily Dutch news brief generator (A2+/B1 graded learning summaries).
// Copyright-safe by design: fetches only public RSS headlines & brief snippets,
// synthesizes original learner-level Dutch summaries with attribution links back to sources.
import { sql } from './_delft-db.js';

export const RSS_FEEDS = [
  { name: 'NOS Nieuws', url: 'https://feeds.nos.nl/nosnieuwsbinnenland' },
  { name: 'NOS Economie', url: 'https://feeds.nos.nl/nosnieuwseconomie' },
  { name: 'NOS Jeugdjournaal', url: 'https://feeds.nos.nl/jeugdjournaal' },
  { name: 'Rijksoverheid', url: 'https://feeds.rijksoverheid.nl/nieuws.rss' },
];

export const STARTER_NEWS_ITEMS = [
  {
    id: 'starter-ns-spits',
    category: '交通出行',
    level: 'A2+',
    titleNl: 'Reizen met de trein: let op de spitsuren',
    titleZh: '荷兰坐火车：留意高峰时段与省钱折扣',
    bodyNl: 'Veel mensen in Nederland reizen elke dag met de trein naar werk of school. Tijdens de spits is het vaak druk en betaal je het normale tarief. Buiten de spits kun je met een daluren-abonnement veel geld besparen. Controleer voor vertrek altijd de NS-app voor actuele werktijden en vertragingen.',
    summaryZh: '在荷兰通勤或上学坐火车时，高峰时段人多且按全价计费；选择非高峰订阅（Dal Voordeel）可在平峰与周末省下不少交通费，出发前建议先查 NS App 看实时延误。',
    vocab: [
      { nl: 'de spits', zh: '高峰时段', note: '工作日上午 6:30–9:00 与下午 16:00–18:30' },
      { nl: 'het tarief', zh: '票价 / 费率', note: 'het normale tarief（正常票价）' },
      { nl: 'besparen', zh: '节省（钱/时间）', note: 'geld besparen（省钱）' },
      { nl: 'de vertraging', zh: '延误', note: '常见于车站广播与 NS App 提醒' },
    ],
    question: {
      promptNl: 'Wanneer kun je volgens de tekst geld besparen met een daluren-abonnement?',
      options: ['Alleen tijdens de ochtendspits', 'Buiten de drukke spitsuren', 'Alleen als de trein vertraging heeft'],
      answer: 1,
      whyZh: '正文明确写了 "Buiten de spits kun je met een daluren-abonnement veel geld besparen"（在非高峰时段可以省钱）。',
    },
    sourceName: 'NS Reizigersinformatie',
    sourceUrl: 'https://www.ns.nl/abonnementen',
  },
  {
    id: 'starter-huurtoeslag',
    category: '政策与生活',
    level: 'B1',
    titleNl: 'Huurtoeslag aanvragen: controleer jaarlijks je gegevens',
    titleZh: '申请荷兰租房补贴：每年记得核对收入与房租信息',
    bodyNl: 'Woon je in een zelfstandige huurwoning en is je inkomen niet te hoog? Dan heb je mogelijk recht op huurtoeslag van de Belastingdienst. Verandert je salaris of je kale huur in de loop van het jaar, geef dat dan op tijd door via Mijn Toeslagen. Zo voorkom je dat je later een groot bedrag moet terugbetalen.',
    summaryZh: '租住独立住房且收入在门槛以下时，可向荷兰税务局申请租房补贴（Huurtoeslag）。若年内工资或基础房租有变动，需及时在 Mijn Toeslagen 更新，以免次年被追缴差额。',
    vocab: [
      { nl: 'de huurtoeslag', zh: '租房补贴', note: '由 Belastingdienst 按月发放' },
      { nl: 'zelfstandig', zh: '独立的', note: 'zelfstandige woning（带独立门牌与厨卫的房源）' },
      { nl: 'doorgeven', zh: '申报 / 通知', note: '可分动词：geef dat op tijd door' },
      { nl: 'terugbetalen', zh: '退还 / 补缴', note: '多领补贴后需退回税务局' },
    ],
    question: {
      promptNl: 'Waarom moet je een verandering in je inkomen op tijd doorgeven?',
      options: ['Om te voorkomen dat je later geld moet terugbetalen', 'Omdat je anders moet verhuizen', 'Om direct een hogere huur te krijgen'],
      answer: 0,
      whyZh: '末句指出 "Zo voorkom je dat je later een groot bedrag moet terugbetalen"（避免事后一次性退还大额补贴）。',
    },
    sourceName: 'Rijksoverheid · Huurtoeslag',
    sourceUrl: 'https://www.rijksoverheid.nl/onderwerpen/huurtoeslag',
  },
  {
    id: 'starter-knmi-weer',
    category: '实用生活',
    level: 'A2+',
    titleNl: 'Hard waaien in Nederland: wat betekent code geel?',
    titleZh: '荷兰大风预警：气象局 KNMI 的黄色预警代表什么？',
    bodyNl: 'In Nederland kan het weer snel omslaan, vooral in de herfst en winter. Bij harde windstoten of gladheid geeft het KNMI soms code geel af. Dat betekent dat het weer gevaarlijk kan zijn voor fietsers en automobilisten. Houd daarom rekening met extra reistijd en blijf voorzichtig in het verkeer.',
    summaryZh: '荷兰秋冬季天气变化极快，遇到强阵风或路面结冰时，气象局 KNMI 会发布 code geel（黄色预警），提醒骑车和驾车出行者注意安全并预留额外通勤时间。',
    vocab: [
      { nl: 'omslaan', zh: '突然转变（天气）', note: 'het weer kan snel omslaan' },
      { nl: 'de windstoot', zh: '阵风（复数 windstoten）', note: 'harde windstoten（强阵风）' },
      { nl: 'de gladheid', zh: '路面湿滑 / 结冰', note: '冬季骑车常见预警词' },
      { nl: 'rekening houden met', zh: '考虑到 / 留出余量', note: '高频搭配：houd rekening met extra reistijd' },
    ],
    question: {
      promptNl: 'Wat is het advies bij code geel volgens het bericht?',
      options: ['Altijd binnen blijven tot de lente', 'Extra reistijd plannen en voorzichtig zijn in het verkeer', 'Alleen met de fiets naar het werk gaan'],
      answer: 1,
      whyZh: '最后一句提醒 "Houd daarom rekening met extra reistijd en blijf voorzichtig in het verkeer"（预留额外时间并注意交通安全）。',
    },
    sourceName: 'KNMI Weerwaarschuwingen',
    sourceUrl: 'https://www.knmi.nl/nederland-nu/weer/waarschuwingen',
  },
];

export function amsterdamDayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function decodeXml(raw) {
  return String(raw || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) && code > 31 && code < 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

export function parseRssXml(xml, sourceName) {
  const items = [];
  const blocks = String(xml || '').match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = extractTag(block, 'title').slice(0, 180);
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description').slice(0, 360);
    const pubDate = extractTag(block, 'pubDate');
    let safeLink = '';
    try {
      const u = new URL(link);
      if (u.protocol === 'https:') safeLink = u.href;
    } catch {}
    if (!title || !safeLink) continue;
    items.push({ title, link: safeLink, description, pubDate, sourceName });
  }
  return items;
}

function sanitizeNewsItems(rawList, candidates, day) {
  if (!Array.isArray(rawList)) return [];
  const validLevels = new Set(['A2+', 'B1']);
  const out = [];
  const usedCandidates = new Set();

  for (const entry of rawList) {
    if (!entry || typeof entry !== 'object') continue;
    const idx = Number(entry.candidateIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= candidates.length || usedCandidates.has(idx)) continue;
    const cand = candidates[idx];
    const titleNl = String(entry.titleNl || '').trim().slice(0, 140);
    const titleZh = String(entry.titleZh || '').trim().slice(0, 100);
    const bodyNl = String(entry.bodyNl || '').trim().slice(0, 900);
    const summaryZh = String(entry.summaryZh || '').trim().slice(0, 320);
    const category = String(entry.category || '荷兰社会').trim().slice(0, 24);
    const level = validLevels.has(entry.level) ? entry.level : 'A2+';
    const vocab = (Array.isArray(entry.vocab) ? entry.vocab : [])
      .filter(v => v && typeof v === 'object' && String(v.nl || '').trim() && String(v.zh || '').trim())
      .slice(0, 5)
      .map(v => ({
        nl: String(v.nl).trim().slice(0, 60),
        zh: String(v.zh).trim().slice(0, 60),
        note: String(v.note || '').trim().slice(0, 120),
      }));
    const q = entry.question;
    const options = Array.isArray(q?.options)
      ? q.options.map(o => String(o || '').trim().slice(0, 140)).filter(Boolean).slice(0, 3)
      : [];
    const answer = Number(q?.answer);
    const question = q && String(q.promptNl || '').trim() && options.length === 3 && Number.isInteger(answer) && answer >= 0 && answer < 3
      ? {
          promptNl: String(q.promptNl).trim().slice(0, 200),
          options,
          answer,
          whyZh: String(q.whyZh || '').trim().slice(0, 220),
        }
      : null;

    if (!titleNl || !titleZh || bodyNl.length < 40 || !summaryZh || vocab.length < 2 || !question) continue;
    usedCandidates.add(idx);
    out.push({
      id: `${day}-${out.length + 1}`,
      category,
      level,
      titleNl,
      titleZh,
      bodyNl,
      summaryZh,
      vocab,
      question,
      sourceName: cand.sourceName,
      sourceUrl: cand.link,
    });
    if (out.length >= 3) break;
  }
  return out;
}

export async function generateDailyNews({ force = false, fetchFn = fetch, now = new Date() } = {}) {
  const day = amsterdamDayKey(now);
  if (!force) {
    const existing = (await sql('SELECT items_json FROM delft_daily_news WHERE day=?', [day])).rows[0];
    if (existing?.items_json) {
      const items = JSON.parse(existing.items_json);
      return { ok: true, skipped: true, day, count: items.length, items };
    }
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 未配置，无法生成今日简报');
  }

  const settled = await Promise.allSettled(
    RSS_FEEDS.map(async feed => {
      const resp = await fetchFn(feed.url, {
        headers: { 'User-Agent': 'HebaoDailyDutchBot/1.0 (+https://hebaogj.xyz)' },
        signal: AbortSignal.timeout(7000),
      });
      if (!resp.ok) throw new Error(`${feed.name} HTTP ${resp.status}`);
      return parseRssXml(await resp.text(), feed.name);
    })
  );

  const cutoffMs = now.getTime() - 72 * 3600 * 1000;
  const seenTitles = new Set();
  const candidates = [];
  for (const res of settled) {
    if (res.status !== 'fulfilled') continue;
    for (const item of res.value) {
      const key = item.title.toLowerCase();
      if (seenTitles.has(key)) continue;
      const parsedTime = item.pubDate ? Date.parse(item.pubDate) : NaN;
      if (Number.isFinite(parsedTime) && parsedTime < cutoffMs) continue;
      seenTitles.add(key);
      candidates.push(item);
      if (candidates.length >= 16) break;
    }
    if (candidates.length >= 16) break;
  }

  if (candidates.length < 2) {
    throw new Error('未能从荷兰公开新闻源获取到足够的新鲜资讯');
  }

  const prompt = `你是一位面向在荷华人与留学生（已有荷兰语 A2/B1 基础）的资深荷兰语老师。
下面是从荷兰官方/公共新闻 RSS 获取的最新标题与简介候选（共 ${candidates.length} 条）。请挑选其中**最贴近在荷生活、交通、住房、政策、经济或社会热点**的 3 条（避开暴力凶案、纯球赛比分、八卦），用你自己的**简洁自然 A2+/B1 荷兰语原创改写**成每日精读简报（严禁照抄原文句子），严格输出 JSON：

【候选列表】
${candidates.map((c, i) => `[${i}] (${c.sourceName}) ${c.title}\n摘要: ${c.description}`).join('\n\n')}

请严格按以下 JSON Schema 输出，不要包含额外文字：
{
  "items": [
    {
      "candidateIndex": 0,
      "category": "交通出行 | 政策与生活 | 经济民生 | 荷兰社会 | 科技教育",
      "level": "A2+" | "B1",
      "titleNl": "简明荷语标题",
      "titleZh": "清晰中文标题（24字以内）",
      "bodyNl": "3到4句原创简易荷语正文（约60-90词，句式清晰，适合A2+到B1精读）",
      "summaryZh": "2句中文要点总结，点出与在荷生活的关系",
      "vocab": [
        {"nl": "核心荷语词或短语（名词带de/het）", "zh": "准确中文释义", "note": "简短用法提示（20字以内）"}
      ],
      "question": {
        "promptNl": "1道关于上文事实的简单荷语问题",
        "options": ["选项A（荷语）", "选项B（荷语）", "选项C（荷语）"],
        "answer": 0,
        "whyZh": "1句中文答案解析"
      }
    }
  ]
}

要求：
1. items 数组输出 3 条，candidateIndex 不能重复且必须在 0..${candidates.length - 1}；
2. 每条 vocab 输出 3–4 个在荷兰日常生活高频出现的实用词；
3. question 必须严格有 3 个不同选项，answer 为 0/1/2。`;

  const response = await fetchFn(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(18000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.25 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini 简报生成失败 (${response.status})`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini 未返回有效简报内容');
  const parsed = JSON.parse(rawText);
  const items = sanitizeNewsItems(parsed.items, candidates, day);
  if (!items.length) throw new Error('生成的简报内容校验未通过');

  const nowIso = now.toISOString();
  await sql(
    `INSERT INTO delft_daily_news(day,items_json,created_at) VALUES(?,?,?)
     ON CONFLICT(day) DO UPDATE SET items_json=excluded.items_json, created_at=excluded.created_at`,
    [day, JSON.stringify(items), nowIso]
  );
  // Retain the latest 21 days so storage stays lean.
  const keepAfter = amsterdamDayKey(new Date(now.getTime() - 21 * 86400000));
  await sql('DELETE FROM delft_daily_news WHERE day < ?', [keepAfter]).catch(() => {});

  return { ok: true, skipped: false, day, count: items.length, items };
}

export async function loadDailyNewsEditions(limit = 7) {
  const safeLimit = Math.max(1, Math.min(14, Number(limit) || 7));
  const rows = (await sql(
    'SELECT day, items_json, created_at FROM delft_daily_news ORDER BY day DESC LIMIT ?',
    [safeLimit]
  )).rows;
  if (!rows.length) {
    return [{
      day: amsterdamDayKey(),
      isStarter: true,
      items: STARTER_NEWS_ITEMS,
    }];
  }
  const editions = [];
  for (const row of rows) {
    try {
      const items = JSON.parse(row.items_json || '[]');
      if (Array.isArray(items) && items.length) {
        editions.push({ day: row.day, isStarter: false, createdAt: row.created_at, items });
      }
    } catch {}
  }
  if (!editions.length) {
    return [{ day: amsterdamDayKey(), isStarter: true, items: STARTER_NEWS_ITEMS }];
  }
  return editions;
}
