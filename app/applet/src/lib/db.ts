export const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('AppDB', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets');
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveAsset = async (key: string, data: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    const store = tx.objectStore('assets');
    store.put(data, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAsset = async (key: string) => {
  const db = await initDB();
  return new Promise<string>((resolve, reject) => {
    const tx = db.transaction('assets', 'readonly');
    const store = tx.objectStore('assets');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as string || '');
    request.onerror = () => reject(request.error);
  });
};

export const deleteAsset = async (key: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    const store = tx.objectStore('assets');
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
