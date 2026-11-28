// Automated daily Dutch news brief generator (A2+/B1 graded learning summaries).
// Copyright-safe by design: fetches only public RSS headlines & brief snippets,
// synthesizes original learner-level Dutch summaries with attribution links back to sources.
import { sql } from './_delft-db.js';

export const RSS_FEEDS = [
  { name: 'NOS Nieuws', url: 'https://feeds.nos.nl/nosnieuwsbinnenland' },
  { name: 'NOS Economie', url: 'https://feeds.nos.nl/nosnieuwseconomie' },
  { name: 'NU.nl', url: 'https://www.nu.nl/rss/Algemeen' },
  { name: 'NOS Op 3', url: 'https://feeds.nos.nl/nosop3' },
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
    bodyZh: '在荷兰，许多人每天乘火车上班或上学。高峰时段往往很拥挤，而且需要按原价购票。在非高峰时段，使用平峰订阅卡可以省下不少钱。出发前记得查看 NS App，了解最新时刻表和延误信息。',
    summaryZh: '在荷兰通勤或上学坐火车时，高峰时段人多且按全价计费；选择非高峰订阅（Dal Voordeel）可在平峰与周末省下不少交通费，出发前建议先查 NS App 看实时延误。',
    vocab: [
      { nl: 'de spits', match: 'spits', zh: '高峰时段', note: '工作日上午 6:30–9:00 与下午 16:00–18:30' },
      { nl: 'het tarief', match: 'tarief', zh: '票价 / 费率', note: 'het normale tarief（正常票价）' },
      { nl: 'het daluren-abonnement', match: 'daluren-abonnement', zh: '平峰订阅卡', note: '如 NS Dal Voordeel 享非高峰 6 折' },
      { nl: 'besparen', match: 'besparen', zh: '节省', note: 'geld besparen（省钱）' },
      { nl: 'de vertraging', match: 'vertragingen', zh: '延误', note: '常见于车站广播与 NS App 提醒' },
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
    bodyZh: '你住在一套独立出租房里，而且收入不算高吗？那你可能有权向荷兰税务局申请租房补贴。如果在这一年中你的工资或基础房租发生了变化，请及时通过 Mijn Toeslagen 申报。这样可以避免日后需要退还一大笔补贴。',
    summaryZh: '租住独立住房且收入在门槛以下时，可向荷兰税务局申请租房补贴（Huurtoeslag）。若年内工资或基础房租有变动，需及时在 Mijn Toeslagen 更新，以免次年被追缴差额。',
    vocab: [
      { nl: 'zelfstandig', match: 'zelfstandige', zh: '独立的', note: 'zelfstandige huurwoning（带独立门牌与厨卫）' },
      { nl: 'de huurtoeslag', match: 'huurtoeslag', zh: '租房补贴', note: '由 Belastingdienst 按月发放' },
      { nl: 'de kale huur', match: 'kale huur', zh: '基础房租（不含水电）', note: '计算房补的核心基数' },
      { nl: 'voorkomen', match: 'voorkom', zh: '避免 / 防止', note: 'zo voorkom je dat...（从而避免…）' },
      { nl: 'terugbetalen', match: 'terugbetalen', zh: '退还 / 补缴', note: '多领补贴后需退回税务局' },
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
    bodyZh: '在荷兰，天气变化可能非常迅速，尤其是秋冬两季。遇到强阵风或路面结冰时，荷兰气象局（KNMI）有时会发布黄色预警。这意味着天气可能对骑行者和驾车人带来危险。因此请预留额外的出行时间，并在路上保持谨慎。',
    summaryZh: '荷兰秋冬季天气变化极快，遇到强阵风或路面结冰时，气象局 KNMI 会发布 code geel（黄色预警），提醒骑车和驾车出行者注意安全并预留额外通勤时间。',
    vocab: [
      { nl: 'omslaan', match: 'omslaan', zh: '骤变（天气）', note: 'het weer kan snel omslaan' },
      { nl: 'de windstoot', match: 'windstoten', zh: '阵风', note: 'harde windstoten（强阵风）' },
      { nl: 'de gladheid', match: 'gladheid', zh: '路面湿滑 / 结冰', note: '冬季骑车常见预警词' },
      { nl: 'rekening houden met', match: 'rekening met', zh: '考虑到 / 留出余量', note: '高频搭配：houd rekening met extra reistijd' },
      { nl: 'voorzichtig', match: 'voorzichtig', zh: '小心的 / 谨慎的', note: 'blijf voorzichtig in het verkeer' },
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

function amsterdamTimeStamp(ms) {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Europe/Amsterdam',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch { return ''; }
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
  const raw = String(xml || '');
  const blocks = raw.match(/<item\b[\s\S]*?<\/item>/gi) || raw.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks) {
    const title = extractTag(block, 'title').slice(0, 180);
    let link = extractTag(block, 'link');
    if (!link) {
      const hrefMatch = block.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i);
      if (hrefMatch) link = decodeXml(hrefMatch[1]);
    }
    const description = (extractTag(block, 'description') || extractTag(block, 'summary')).slice(0, 360);
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated');
    const publishedMs = pubDate ? Date.parse(pubDate) : NaN;
    const publishedAt = Number.isFinite(publishedMs) ? new Date(publishedMs).toISOString() : '';
    let safeLink = '';
    try {
      const u = new URL(link);
      if (u.protocol === 'https:') safeLink = u.href;
    } catch {}
    if (!title || !safeLink) continue;
    items.push({ title, link: safeLink, description, pubDate, publishedMs, publishedAt, sourceName });
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
    const bodyZh = String(entry.bodyZh || entry.summaryZh || '').trim().slice(0, 600);
    const summaryZh = String(entry.summaryZh || entry.bodyZh || '').trim().slice(0, 420);
    const category = String(entry.category || '荷兰社会').trim().slice(0, 24);
    const level = validLevels.has(entry.level) ? entry.level : 'A2+';
    const vocab = (Array.isArray(entry.vocab) ? entry.vocab : [])
      .filter(v => v && typeof v === 'object' && String(v.nl || '').trim() && String(v.zh || '').trim())
      .slice(0, 6)
      .map(v => {
        const item = {
          nl: String(v.nl).trim().slice(0, 60),
          zh: String(v.zh).trim().slice(0, 60),
          note: String(v.note || '').trim().slice(0, 120),
        };
        const match = String(v.match || '').trim().slice(0, 60);
        if (match) item.match = match;
        return item;
      });
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

    if (!titleNl || !titleZh || bodyNl.length < 40 || !bodyZh || vocab.length < 2 || !question) continue;
    usedCandidates.add(idx);
    out.push({
      id: `${day}-${out.length + 1}`,
      category,
      level,
      titleNl,
      titleZh,
      bodyNl,
      bodyZh,
      summaryZh,
      vocab,
      question,
      sourceName: cand.sourceName,
      sourceUrl: cand.link,
      ...(cand.publishedAt ? { publishedAt: cand.publishedAt } : {}),
    });
    if (out.length >= 3) break;
  }
  return out;
}

async function recentSourceUrls(day) {
  const urls = new Set();
  try {
    const rows = (await sql(
      'SELECT items_json FROM delft_daily_news WHERE day < ? ORDER BY day DESC LIMIT 5',
      [day]
    )).rows;
    for (const row of rows) {
      try {
        for (const it of JSON.parse(row.items_json || '[]')) {
          if (it?.sourceUrl) urls.add(String(it.sourceUrl));
        }
      } catch {}
    }
  } catch {}
  return urls;
}

function collectFreshCandidates(settled, { now, recentUrls, maxHours = 24 }) {
  const cutoffMs = now.getTime() - maxHours * 3600 * 1000;
  const seenTitles = new Set();
  const seenLinks = new Set();
  const buckets = [];

  for (const res of settled) {
    if (res.status !== 'fulfilled' || !Array.isArray(res.value)) continue;
    const sorted = [...res.value].sort((a, b) => {
      const ta = Number.isFinite(a.publishedMs) ? a.publishedMs : 0;
      const tb = Number.isFinite(b.publishedMs) ? b.publishedMs : 0;
      return tb - ta;
    });
    const fresh = [];
    for (const item of sorted) {
      const tKey = item.title.toLowerCase();
      if (seenTitles.has(tKey) || seenLinks.has(item.link) || recentUrls.has(item.link)) continue;
      if (Number.isFinite(item.publishedMs) && item.publishedMs < cutoffMs) continue;
      seenTitles.add(tKey);
      seenLinks.add(item.link);
      fresh.push(item);
      if (fresh.length >= 5) break;
    }
    if (fresh.length) buckets.push(fresh);
  }

  // Round-robin across feeds so no single feed crowds out Economie / NU.nl / Rijksoverheid.
  const interleaved = [];
  for (let round = 0; round < 5 && interleaved.length < 18; round++) {
    for (const bucket of buckets) {
      if (bucket[round]) {
        interleaved.push(bucket[round]);
        if (interleaved.length >= 18) break;
      }
    }
  }
  return interleaved;
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

  const [settled, recentUrls] = await Promise.all([
    Promise.allSettled(
      RSS_FEEDS.map(async feed => {
        const resp = await fetchFn(feed.url, {
          headers: { 'User-Agent': 'HebaoDailyDutchBot/1.0 (+https://hebaogj.xyz)' },
          signal: AbortSignal.timeout(7000),
        });
        if (!resp.ok) throw new Error(`${feed.name} HTTP ${resp.status}`);
        return parseRssXml(await resp.text(), feed.name);
      })
    ),
    recentSourceUrls(day),
  ]);

  let candidates = collectFreshCandidates(settled, { now, recentUrls, maxHours: 24 });
  if (candidates.length < 4) {
    candidates = collectFreshCandidates(settled, { now, recentUrls, maxHours: 48 });
  }
  if (candidates.length < 2) {
    throw new Error('未能从荷兰公开新闻源获取到足够的新鲜资讯');
  }

  const prompt = `你是一位面向在荷华人与留学生（已有荷兰语 A2/B1 基础）的资深荷兰语老师。当前荷兰日期为 ${day}。
下面是从荷兰主流新闻源（NOS / NU.nl / Rijksoverheid）刚刚抓取的**近 24 小时最新新闻候选**（共 ${candidates.length} 条）。请优先挑选今天发生、最贴近在荷生活、交通、住房、政策、经济或社会热点的 3 条（避开暴力凶案、纯球赛比分、八卦），用简洁自然的 A2+/B1 荷兰语原创改写成每日精读简报（严禁照抄原文句子），严格输出 JSON：

【候选列表】
${candidates.map((c, i) => `[${i}] (${c.sourceName}${c.publishedMs ? ' · ' + amsterdamTimeStamp(c.publishedMs) : ''}) ${c.title}\n摘要: ${c.description}`).join('\n\n')}

请严格按以下 JSON Schema 输出，不要包含额外文字：
{
  "items": [
    {
      "candidateIndex": 0,
      "category": "交通出行 | 政策与生活 | 经济民生 | 荷兰社会 | 科技教育",
      "level": "A2+" | "B1",
      "titleNl": "简明荷语标题",
      "titleZh": "清晰中文标题（24字以内）",
      "bodyNl": "3到4句原创简易荷语正文（约65-95词，句式自然清晰，适合A2+到B1精读）",
      "bodyZh": "与 bodyNl 逐句对应的自然中文译文（完整准确，方便一键翻转对照）",
      "summaryZh": "1到2句简短中文要点",
      "vocab": [
        {
          "nl": "核心荷语词原形（名词带de/het）",
          "match": "该词在 bodyNl 正文中实际出现的精确拼写片段（区分单复数/变位，用于原文行内加注释）",
          "zh": "精炼中文释义（8字以内，适合行内注音）",
          "note": "简短用法提示（20字以内）"
        }
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
1. items 数组输出 3 条，candidateIndex 不能重复且必须在 0..${candidates.length - 1}，优先选择最新发布且来源多样的资讯；
2. 每条 vocab 输出 4–5 个正文中实际出现的高频/难词，且每个 match 必须是 bodyNl 中精确存在的连续字符；
3. bodyZh 必须完整、忠实地翻译 bodyNl 每一句，供用户一键翻转阅读；
4. question 必须严格有 3 个不同选项，answer 为 0/1/2。`;

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
  const keepAfter = amsterdamDayKey(new Date(now.getTime() - 21 * 86400000));
  await sql('DELETE FROM delft_daily_news WHERE day < ?', [keepAfter]).catch(() => {});

  return { ok: true, skipped: false, day, count: items.length, items };
}

/** Auto-generate today's edition on demand if missing (throttled via atomic DB lock so concurrent visitors never stampede). */
export async function ensureTodayDailyNews({ fetchFn = fetch, now = new Date() } = {}) {
  if (!process.env.GEMINI_API_KEY) return false;
  const day = amsterdamDayKey(now);
  const existing = (await sql('SELECT day FROM delft_daily_news WHERE day=? LIMIT 1', [day])).rows[0];
  if (existing) return false;
  const slot = Math.floor(now.getTime() / (15 * 60 * 1000));
  const lockKey = `daily-news-auto:${day}:${slot}`;
  try {
    const lock = await sql(
      'INSERT OR IGNORE INTO delft_notify_log(dedupe_key, sent_at) VALUES(?, ?)',
      [lockKey, now.toISOString()]
    );
    if (!lock.affected) return false;
    await generateDailyNews({ force: false, fetchFn, now });
    return true;
  } catch (error) {
    console.error('ensureTodayDailyNews:', error?.message || error);
    return false;
  }
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
