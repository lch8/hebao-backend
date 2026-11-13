// Turn listing bundles into items a buyer can actually search and compare.
export function itemPrice(item) {
  if (item.price === null || item.price === undefined || item.price === '') return null;
  const price = Number(item.price);
  return Number.isFinite(price) && price >= 0 ? price : null;
}
export function marketProducts(listings, {query = '', category = '', sort = 'recent'} = {}) {
  const term = query.trim().toLocaleLowerCase();
  const products = listings.filter(listing => !listing.stale).flatMap(listing =>
    listing.items.filter(item => item.status === 'available' &&
      (!category || (item.category || '其他') === category) &&
      (!term || [item.name, item.condition, listing.title, listing.pickup].some(value => String(value || '').toLocaleLowerCase().includes(term)))
    ).map(item => ({listing, item, price: itemPrice(item)}))
  );
  return products.sort((a, b) => {
    if (sort === 'price') {
      const price = (a.price ?? Infinity) - (b.price ?? Infinity);
      if (price && !Number.isNaN(price)) return price;
    }
    return (Date.parse(b.listing.updatedAt) || 0) - (Date.parse(a.listing.updatedAt) || 0);
  });
}
