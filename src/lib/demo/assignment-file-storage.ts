const databaseName = 'wasatify-demo-assignment-files-v1';
const storeName = 'files';

type StoredDemoFile = { id: string; file: Blob; fileName: string; fileType: string };

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Penyimpanan berkas demo tidak tersedia di browser ini.'));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Penyimpanan berkas demo gagal dibuka.'));
  });
}

export async function storeDemoAssignmentFile(file: File) {
  const id = crypto.randomUUID();
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put({ id, file, fileName: file.name, fileType: file.type } satisfies StoredDemoFile);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Berkas demo gagal disimpan.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Berkas demo gagal disimpan.'));
    });
    return id;
  } finally {
    database.close();
  }
}

export async function getDemoAssignmentFile(id: string) {
  const database = await openDatabase();
  try {
    return await new Promise<StoredDemoFile | undefined>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result as StoredDemoFile | undefined);
      request.onerror = () => reject(request.error ?? new Error('Berkas demo gagal dibaca.'));
    });
  } finally {
    database.close();
  }
}

export async function removeDemoAssignmentFile(id: string) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Berkas demo gagal dihapus.'));
    });
  } finally {
    database.close();
  }
}
