// Public destination for poster promotion. Keep this aligned with the production domain.
export const PUBLIC_SITE_URL = 'https://hebao-backend.vercel.app/delft/';

export function posterDestination({ publishedId, dirty } = {}) {
  const url = new URL(PUBLIC_SITE_URL);
  const published = Boolean(publishedId && !dirty);
  if (published) url.searchParams.set('item', publishedId);
  return {
    url: url.href,
    label: published ? '扫码查看最新商品状态' : '扫码逛 Delft 闲置与活动',
    website: `${url.hostname}${url.pathname}`,
    published,
  };
}
