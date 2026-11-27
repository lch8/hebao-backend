// Photos are kept in IndexedDB, with a lightweight localStorage metadata fallback
// for restricted WebViews (e.g. WeChat built-in browser).
const FALLBACK_KEY = 'hebao_delft_draft_fallback_v1';
let databasePromise;

function database() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('hebao-delft', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => { databasePromise = null; throw error; });
  return databasePromise;
}

async function transact(mode, operation) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', mode);
    const request = operation(transaction.objectStore('drafts'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('草稿保存中断'));
  });
}

function stripLargeBlobs(draft) {
  if (!draft || typeof draft !== 'object') return draft;
  return {
    ...draft,
    photosOnlyMetadata: Array.isArray(draft.photos) && draft.photos.some(p => p.dataUrl && !p.photo),
    photos: Array.isArray(draft.photos)
      ? draft.photos.map(p => ({ ...p, dataUrl: '' }))
      : [],
  };
}

export async function readDraft() {
  try {
    const saved = await transact('readonly', store => store.get('current'));
    if (saved) return saved;
  } catch {}
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export async function writeDraft(draft) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(stripLargeBlobs(draft)));
  } catch {}
  return transact('readwrite', store => store.put(draft, 'current'));
}

export async function deleteDraft() {
  try { localStorage.removeItem(FALLBACK_KEY); } catch {}
  return transact('readwrite', store => store.delete('current'));
}
