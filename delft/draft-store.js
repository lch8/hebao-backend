// Photos are kept in IndexedDB, avoiding localStorage's small string quota.
let databasePromise;
function database() {
  if (!databasePromise) databasePromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open('hebao-delft',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  }).catch(error=>{databasePromise=null;throw error;});
  return databasePromise;
}
async function transact(mode,operation) {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction('drafts',mode);
    const request=operation(transaction.objectStore('drafts'));
    transaction.oncomplete=()=>resolve(request.result);
    transaction.onerror=()=>reject(transaction.error);
    transaction.onabort=()=>reject(transaction.error || new Error('草稿保存中断'));
  });
}
export const readDraft=()=>transact('readonly',store=>store.get('current'));
export const writeDraft=draft=>transact('readwrite',store=>store.put(draft,'current'));
export const deleteDraft=()=>transact('readwrite',store=>store.delete('current'));
