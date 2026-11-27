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

export function marketProducts(listings, { query = '', category = '', city = 'all', sort = 'recent' } = {}) {
  const term = query.trim().toLocaleLowerCase();
  const products = listings
    .filter(listing => !listing.stale && matchesListingCity(listing, city))
    .flatMap(listing =>
      listing.items.filter(item => item.status === 'available' &&
        (!category || (item.category || '其他') === category) &&
        (!term || [item.name, item.condition, listing.title, listing.pickup].some(value => String(value || '').toLocaleLowerCase().includes(term)))
      ).map(item => ({ listing, item, price: itemPrice(item) }))
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
