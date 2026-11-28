// Turn listing bundles into items a buyer can actually search and compare.
const SOUTH_HOLLAND = new Set(['delft', 'den-haag', 'rotterdam']);

export function itemPrice(item) {
  if (item.price === null || item.price === undefined || item.price === '') return null;
  const price = Number(item.price);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function matchesListingCity(listing, city = 'all') {
  if (!city || city === 'all') return true;
  const listingCity = listing.city || 'delft';
  if (city === 'zuid-holland') return SOUTH_HOLLAND.has(listingCity);
  return listingCity === city;
}

export const favoriteKey = (listingId, itemId) => `${listingId}:${itemId}`;

export function marketProducts(listings, {
  query = '',
  category = '',
  city = 'all',
  sort = 'recent',
  freeOnly = false,
  maxPrice = null,
  favoritesOnly = false,
  favoriteKeys = null,
} = {}) {
  const term = query.trim().toLocaleLowerCase();
  const favSet = favoritesOnly
    ? (favoriteKeys instanceof Set ? favoriteKeys : new Set(Array.isArray(favoriteKeys) ? favoriteKeys : []))
    : null;
  const ceiling = maxPrice === null || maxPrice === undefined || maxPrice === '' ? null : Number(maxPrice);
  const products = listings
    .filter(listing => !listing.stale && matchesListingCity(listing, city))
    .flatMap(listing =>
      listing.items.filter(item => {
        if (item.status !== 'available') return false;
        if (category && (item.category || '其他') !== category) return false;
        if (term && ![item.name, item.condition, listing.title, listing.pickup].some(value => String(value || '').toLocaleLowerCase().includes(term))) {
          return false;
        }
        const price = itemPrice(item);
        if (freeOnly && price !== 0) return false;
        if (ceiling !== null && Number.isFinite(ceiling) && (price === null || price > ceiling)) return false;
        if (favSet && !favSet.has(favoriteKey(listing.id, item.id))) return false;
        return true;
      }).map(item => ({ listing, item, price: itemPrice(item) }))
    );
  return products.sort((a, b) => {
    if (sort === 'price') {
      const aUnpriced = a.price === null;
      const bUnpriced = b.price === null;
      // Unpriced ("待议") items strictly sort after all priced/free items so they never pollute low-price results.
      if (aUnpriced !== bUnpriced) return aUnpriced ? 1 : -1;
      if (!aUnpriced && a.price !== b.price) return a.price - b.price;
    }
    return (Date.parse(b.listing.updatedAt) || 0) - (Date.parse(a.listing.updatedAt) || 0);
  });
}
