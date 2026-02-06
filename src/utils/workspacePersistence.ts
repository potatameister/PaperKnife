/**
 * Workspace Persistence Utility
 * Uses IndexedDB to store heavy PDF buffers and tool states locally.
 * This allows "Privacy Vault" feature: recovering work after refresh.
 */

const DB_NAME = 'PaperKnifeWorkspace';
const DB_VERSION = 1;
const STORE_NAME = 'workspaces';

interface WorkspaceData {
  toolId: string;
  files: {
    name: string;
    buffer: Uint8Array;
    settings: any;
  }[];
  lastUpdated: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'toolId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveWorkspace = async (toolId: string, files: { name: string, buffer: Uint8Array, settings: any }[]) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: WorkspaceData = {
      toolId,
      files,
      lastUpdated: Date.now()
    };
    store.put(data);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Save Workspace Error:', e);
  }
};

export const getWorkspace = async (toolId: string): Promise<WorkspaceData | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(toolId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Get Workspace Error:', e);
    return null;
  }
};

export const clearWorkspace = async (toolId: string) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(toolId);
  } catch (e) {
    console.error('Clear Workspace Error:', e);
  }
};
