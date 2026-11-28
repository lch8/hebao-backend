// Public destination and route mapping. Custom domains resolve dynamically;
// preview/localhost environments fall back to https://hebaogj.xyz for QR codes.
export const DEFAULT_SITE_ORIGIN = 'https://hebaogj.xyz';
export const PUBLIC_SITE_URL = `${DEFAULT_SITE_ORIGIN}/`;

export const SITE_TABS = ['events', 'dutch', 'market', 'mine', 'sell'];

export const TAB_PATHS = {
  events: '/events',
  dutch: '/dutch-a2',
  market: '/market',
  mine: '/mine',
  sell: '/sell',
};

const PATH_TO_TAB = {
  '/': 'events',
  '/events': 'events',
  '/events/': 'events',
  '/dutch-a2': 'dutch',
  '/dutch-a2/': 'dutch',
  '/dutch': 'dutch',
  '/dutch/': 'dutch',
  '/news': 'dutch',
  '/news/': 'dutch',
  '/market': 'market',
  '/market/': 'market',
  '/mine': 'mine',
  '/mine/': 'mine',
  '/sell': 'sell',
  '/sell/': 'sell',
};

export function resolveSiteOrigin(loc = globalThis.location) {
  try {
    if (loc && loc.protocol === 'https:' && loc.hostname &&
        !loc.hostname.endsWith('.vercel.app') &&
        !['localhost', '127.0.0.1'].includes(loc.hostname)) {
      return loc.origin;
    }
  } catch {}
  return DEFAULT_SITE_ORIGIN;
}

export function tabPath(tab) {
  return TAB_PATHS[tab] || '/events';
}

export function pageFromQuery(params) {
  if (params.get('item')) return 'market';
  if (params.get('event') || params.get('activity')) return 'events';
  const tab = params.get('tab');
  if (SITE_TABS.includes(tab)) return tab;
  return 'events';
}

export function pageFromLocation({ pathname = '/', search = '' } = {}) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  if (params.get('item')) return 'market';
  if (params.get('event') || params.get('activity')) return 'events';
  const explicitTab = params.get('tab');
  if (SITE_TABS.includes(explicitTab)) return explicitTab;
  const clean = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH_TO_TAB[clean]) return PATH_TO_TAB[clean];
  return 'events';
}

export function legalModalFromLocation({ pathname = '', search = '' } = {}) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const clean = String(pathname || '').replace(/\/+$/, '');
  if (clean === '/privacy' || params.get('legal') === 'privacy') return 'privacy';
  if (clean === '/terms' || params.get('legal') === 'terms') return 'terms';
  return '';
}

export function activityLink(id, loc) {
  const url = new URL('/events', resolveSiteOrigin(loc));
  url.searchParams.set('activity', id);
  return url.href;
}

export function eventShareLink(id, loc) {
  const url = new URL('/events', resolveSiteOrigin(loc));
  url.searchParams.set('event', id);
  return url.href;
}

export function listingShareLink(id, loc, productId = '') {
  const url = new URL('/market', resolveSiteOrigin(loc));
  url.searchParams.set('item', id);
  if (productId) url.searchParams.set('product', productId);
  return url.href;
}

export function posterDestination({ publishedId, dirty, loc } = {}) {
  const origin = resolveSiteOrigin(loc);
  const published = Boolean(publishedId && !dirty);
  const url = new URL(published ? '/market' : '/', origin);
  if (published) url.searchParams.set('item', publishedId);
  return {
    url: url.href,
    label: published ? '微信/相机扫码看实时在售状态' : '扫码打开荷包 · 逛闲置与找搭子',
    website: published ? `${url.hostname}/market` : url.hostname,
    published,
  };
}
