// Public destination for poster promotion. Keep this aligned with the production domain.
export const PUBLIC_SITE_URL = 'https://hebao-backend.vercel.app/delft/';

export const SITE_TABS = ['events','dutch','market','mine','sell'];

export function pageFromQuery(params) {
  if (params.get('item')) return 'market';
  if (params.get('event') || params.get('activity')) return 'events';
  const tab = params.get('tab');
  if (SITE_TABS.includes(tab)) return tab;
  return 'events';
}

export function activityLink(id) {
  const url = new URL(PUBLIC_SITE_URL);
  url.searchParams.set('activity', id);
  return url.href;
}

export function posterDestination({ publishedId, dirty } = {}) {
  const url = new URL(PUBLIC_SITE_URL);
  const published = Boolean(publishedId && !dirty);
  if (published) url.searchParams.set('item', publishedId);
  return {
    url: url.href,
    label: published ? '扫码查看最新商品状态' : '扫码打开荷包',
    website: `${url.hostname}${url.pathname}`,
    published,
  };
}
