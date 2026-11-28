// Server-side HTML shell + dynamic Open Graph injector for WeChat, WhatsApp & search engines.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from './_delft-db.js';
import { cities, cityEvents } from '../delft/city-events.js';
import { DEFAULT_SITE_ORIGIN } from '../delft/site-config.js';

let cachedHtml = '';
let cachedFeed = null;

// Vercel may transpile this file to CommonJS, where `import.meta.url` is undefined.
// Resolve bundled static files from the function's working directory first.
function readProjectFile(relativePath) {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), '..', relativePath),
  ];
  try {
    if (typeof __dirname === 'string') candidates.push(path.join(__dirname, '..', relativePath));
  } catch { /* ESM runtime: __dirname not defined */ }
  let lastError;
  for (const file of candidates) {
    try { return readFileSync(file, 'utf8'); } catch (error) { lastError = error; }
  }
  throw lastError || new Error(`Cannot read ${relativePath}`);
}

function getTemplateHtml() {
  if (!cachedHtml) {
    cachedHtml = readProjectFile('delft/index.html');
  }
  return cachedHtml;
}

function getCuratedFeed() {
  if (!cachedFeed) {
    try {
      const raw = JSON.parse(readProjectFile('delft/events-feed.json'));
      cachedFeed = Array.isArray(raw?.events) ? raw.events : cityEvents;
    } catch {
      cachedFeed = cityEvents;
    }
  }
  return cachedFeed;
}

const escAttr = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const formatAmsterdam = iso => {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Europe/Amsterdam', month: 'long', day: 'numeric',
      weekday: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso));
  } catch { return ''; }
};

export function renderShareHtml(baseHtml, { title, description, url, image }) {
  const safeTitle = escAttr(title);
  const safeDesc = escAttr(description);
  const safeUrl = escAttr(url);
  const safeImg = escAttr(image);
  return baseHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${safeUrl}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${safeImg}" />`);
}

export async function resolveShareMeta({
  pathname = '/',
  searchParams = new URLSearchParams(),
  origin = DEFAULT_SITE_ORIGIN,
  getListing,
  getEvent,
  feedEvents = cityEvents,
}) {
  const cleanOrigin = String(origin || DEFAULT_SITE_ORIGIN).replace(/\/+$/, '');
  const defaultImage = `${cleanOrigin}/delft/og-cover.jpg?v=20261128e`;
  const itemId = searchParams.get('item');
  const productId = searchParams.get('product');
  const eventId = searchParams.get('event');
  const activityId = searchParams.get('activity');

  if (itemId && getListing) {
    const listing = await getListing(itemId).catch(() => null);
    if (listing) {
      const cityName = cities[listing.city || 'delft'] || 'Delft';
      const items = Array.isArray(listing.items) ? listing.items : [];
      const available = items.filter(i => i.status === 'available');
      const focus = items.find(i => i.id === productId) || available[0] || items[0];
      const priceStr = focus
        ? (focus.price === null || focus.price === '' || focus.price === undefined
          ? '价格待议'
          : Number(focus.price) === 0 ? '免费赠送' : `€${Number(focus.price)}`)
        : '';
      // Database-fallback photos are stored as same-origin paths; OG cards need absolute URLs.
      const absolute = src => /^https:\/\//.test(src || '') ? src : /^\/api\/delft-image\?id=/.test(src || '') ? `${cleanOrigin}${src}` : '';
      const photo = absolute(focus?.photo) || items.map(i => absolute(i.photo)).find(Boolean) || defaultImage;
      const url = new URL('/market', cleanOrigin);
      url.searchParams.set('item', itemId);
      if (productId) url.searchParams.set('product', productId);
      return {
        title: focus && productId
          ? `${focus.name}（${priceStr}）· ${cityName} 闲置 · 荷包`
          : `${listing.title} · ${cityName} 闲置（${available.length} 件在售）· 荷包`,
        description: `${cityName} · ${listing.pickup} 自取｜${available.slice(0, 4).map(i => `${i.name}${i.price != null && i.price !== '' ? ' €' + Number(i.price) : ''}`).join('、') || '点开查看最新在售与已出状态'}`,
        url: url.href,
        image: photo,
      };
    }
  }

  if (eventId && getEvent) {
    const ev = await getEvent(eventId).catch(() => null);
    if (ev) {
      const isOnline = ev.mode === 'online' || ev.city === 'online';
      const cityName = isOnline ? '全荷线上' : (cities[ev.city || 'delft'] || 'Delft');
      const url = new URL('/events', cleanOrigin);
      url.searchParams.set('event', eventId);
      const statusTag = ev.cancelled ? '【已取消】' : `${ev.count}/${ev.capacity} 人`;
      const timeLabel = ev.scheduleType === 'flexible'
        ? `灵活约伴 · ${ev.scheduleNote || '时间可商量'}`
        : `${formatAmsterdam(ev.startsAt)}（荷兰时间）`;
      return {
        title: `${ev.cancelled ? '【已取消】' : ''}${isOnline ? '【线上】' : ''}${ev.title} · ${isOnline ? '全荷找搭子' : `${cityName} 同城约伴`} · 荷包`,
        description: `${timeLabel} · ${cityName} ${ev.place} · ${ev.host} 发起（${statusTag}）`,
        url: url.href,
        image: defaultImage,
      };
    }
  }

  if (activityId) {
    const act = feedEvents.find(a => a.id === activityId) || cityEvents.find(a => a.id === activityId);
    if (act) {
      const cityName = cities[act.city || 'delft'] || 'Delft';
      const url = new URL('/events', cleanOrigin);
      url.searchParams.set('activity', activityId);
      const image = act.imageUrl && /^https:\/\//.test(act.imageUrl) ? act.imageUrl : defaultImage;
      return {
        title: `${act.title} · ${cityName} 城市活动 · 荷包`,
        description: `${formatAmsterdam(act.startsAt)} · ${act.place} · ${act.fee || act.price || ''}`,
        url: url.href,
        image,
      };
    }
  }

  const cleanPath = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (cleanPath === '/market' || cleanPath === '/sell') {
    return {
      title: '在荷闲置与搬家清仓海报工具 · 荷包',
      description: '单件多图发布、价格与收藏筛选、一键生成微信实时库存清仓海报；14 天在售确认，咨询邮件直达。',
      url: `${cleanOrigin}${cleanPath}`,
      image: defaultImage,
    };
  }
  if (cleanPath === '/news') {
    if (searchParams.get('view') === 'city') {
      return {
        title: '荷兰六城近期城市活动 · 荷包',
        description: '精选 Delft、海牙、鹿特丹、阿姆斯特丹、乌特勒支与埃因霍温近期市集、展览与免费城市活动。',
        url: `${cleanOrigin}/news?view=city`,
        image: defaultImage,
      };
    }
    return {
      title: '每日荷语新闻简报（A2+/B1 精读）· 荷包',
      description: '每日精选 3 条荷兰本地生活、交通与政策资讯，AI 改写为地道 A2+/B1 荷语短文，配难词词注、中文译文翻转、朗读与理解自测。',
      url: `${cleanOrigin}/news`,
      image: defaultImage,
    };
  }
  if (cleanPath === '/dutch-a2' || cleanPath === '/dutch') {
    const viewParam = searchParams.get('view');
    if (viewParam === 'city') {
      return {
        title: '荷兰六城近期城市活动 · 荷包',
        description: '精选 Delft、海牙、鹿特丹、阿姆斯特丹、乌特勒支与埃因霍温近期市集、展览与免费城市活动。',
        url: `${cleanOrigin}/news?view=city`,
        image: defaultImage,
      };
    }
    if (viewParam === 'news') {
      return {
        title: '每日荷语新闻简报（A2+/B1 精读）· 荷包',
        description: '每日精选 3 条荷兰本地生活、交通与政策资讯，AI 改写为地道 A2+/B1 荷语短文，配难词词注、中文译文翻转、朗读与理解自测。',
        url: `${cleanOrigin}/dutch-a2?view=news`,
        image: defaultImage,
      };
    }
    if (['a2', 'prepare', 'today', 'exam'].includes(viewParam)) {
      return {
        title: '荷兰语 A2 备考 · DUO 五科专项与 AI 批改 · 荷包',
        description: '全荷通用：DUO 五科专项与 A/B 模拟卷、写作 AI 按评分要点批改、全科错题本与高频词闪卡。',
        url: `${cleanOrigin}/dutch-a2?view=${viewParam}`,
        image: defaultImage,
      };
    }
    return {
      title: '每日荷语简报与荷兰语 A2 备考 · 荷包',
      description: '每天 3 条荷兰本地 A2+/B1 荷语新闻精读（配朗读与生词本），并内置全荷通用 DUO A2 五科专项、模拟卷与写作 AI 批改。',
      url: `${cleanOrigin}/dutch-a2`,
      image: defaultImage,
    };
  }
  if (cleanPath === '/events') {
    return {
      title: '在荷线上与线下找搭子 · 荷包',
      description: '全荷线上组队（荷语口语互练、线上自习、游戏开黑）与同城线下小局（桌游、咖啡、运动、约饭），支持长期灵活约伴。',
      url: `${cleanOrigin}/events`,
      image: defaultImage,
    };
  }
  if (cleanPath === '/privacy') {
    return {
      title: '隐私政策（GDPR 合规声明）· 荷包',
      description: '荷包数据收集说明、第三方处理方、保留周期及欧盟 GDPR 数据导出与账号注销权利。',
      url: `${cleanOrigin}/privacy`,
      image: defaultImage,
    };
  }
  if (cleanPath === '/terms') {
    return {
      title: '使用条款与安全须知 · 荷包',
      description: '在荷二手闲置当面验货防骗指南与线上线下找搭子安全准则。',
      url: `${cleanOrigin}/terms`,
      image: defaultImage,
    };
  }

  return {
    title: '荷包 · 每日荷语资讯、A2 备考、在荷找搭子与逛闲置',
    description: '每日荷兰本地新闻精读（难词词注/译文翻转）与六城活动、DUO A2 五科模拟卷与 AI 写作批改、全荷线上线下找搭子及二手闲置清仓。',
    url: `${cleanOrigin}${cleanPath === '/' ? '/' : cleanPath}`,
    image: defaultImage,
  };
}

async function queryListingFromDb(id) {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) return null;
  const row = (await sql('SELECT id, city, seller_name, title, pickup, items_json FROM delft_listings WHERE id=?', [id.slice(0, 60)])).rows[0];
  if (!row) return null;
  return {
    id: row.id,
    city: row.city || 'delft',
    seller: row.seller_name,
    title: row.title,
    pickup: row.pickup,
    items: JSON.parse(row.items_json || '[]'),
  };
}

async function queryEventFromDb(id) {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) return null;
  const row = (await sql(
    `SELECT e.*,
      (SELECT COUNT(*) FROM delft_rsvps r WHERE r.event_id=e.id) AS rsvp_count
     FROM delft_events e WHERE e.id=?`, [id.slice(0, 60)]
  )).rows[0];
  if (!row) return null;
  const mode = row.mode === 'online' || row.city === 'online' ? 'online' : 'offline';
  return {
    id: row.id,
    city: mode === 'online' ? 'online' : (row.city || 'delft'),
    mode,
    scheduleType: row.schedule_type === 'flexible' ? 'flexible' : 'fixed',
    scheduleNote: row.schedule_note || '',
    host: row.host_name,
    title: row.title,
    startsAt: row.starts_at,
    place: row.place,
    capacity: Number(row.capacity),
    count: Number(row.rsvp_count || 0) + 1,
    cancelled: Boolean(Number(row.cancelled || 0)),
  };
}

export default async function handler(req, res) {
  let html;
  try {
    html = getTemplateHtml();
  } catch (error) {
    // Never 500 the homepage: fall back to the static app shell.
    console.error('share-page template error:', error);
    const qs = String(req.url || '').split('?')[1] || '';
    const params = new URLSearchParams(qs);
    const tab = String(params.get('__path') || '/').replace(/^\//, '');
    params.delete('__path');
    if (tab && !params.has('page')) params.set('page', tab === 'dutch-a2' ? 'dutch' : tab);
    const query = params.toString();
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(302, { Location: `/delft/${query ? `?${query}` : ''}` });
    res.end();
    return;
  }
  try {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const isCustomDomain = host && !host.endsWith('.vercel.app') && !host.startsWith('localhost') && !host.startsWith('127.0.0.1');
    const origin = isCustomDomain ? `${proto}://${host}` : (process.env.PUBLIC_SITE_ORIGIN || DEFAULT_SITE_ORIGIN);

    const parsedUrl = new URL(req.url || '/', 'https://hebaogj.xyz');
    const pathname = parsedUrl.searchParams.get('__path') || parsedUrl.pathname || '/';

    const withTimeout = (promise, ms = 2200) => Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve(null), ms)),
    ]);

    const meta = await resolveShareMeta({
      pathname,
      searchParams: parsedUrl.searchParams,
      origin,
      getListing: id => withTimeout(queryListingFromDb(id)),
      getEvent: id => withTimeout(queryEventFromDb(id)),
      feedEvents: getCuratedFeed(),
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(renderShareHtml(html, meta));
  } catch (error) {
    console.error('share-page error:', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  }
}
