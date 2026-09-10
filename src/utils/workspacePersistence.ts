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

const MAX_WORKSPACE_BYTES = 50 * 1024 * 1024;
const WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000;

const closeDB = (db: IDBDatabase) => {
  try { db.close(); } catch { /* ignore */ }
};

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
    let total = 0;
    for (const f of files) total += f.buffer?.byteLength || 0;
    if (total > MAX_WORKSPACE_BYTES) return false;
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: WorkspaceData = {
      toolId,
      files,
      lastUpdated: Date.now()
    };
    store.put(data);
    return new Promise((resolve) => {
      tx.oncomplete = () => { closeDB(db); resolve(true); };
      tx.onerror = () => { closeDB(db); resolve(false); };
    });
  } catch (e) {
    console.error('Save Workspace Error:', e);
    return false;
  }
};

export const getWorkspace = async (toolId: string): Promise<WorkspaceData | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(toolId);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const res = (request.result || null) as WorkspaceData | null;
        closeDB(db);
        if (res && Date.now() - res.lastUpdated > WORKSPACE_TTL_MS) { clearWorkspace(toolId); resolve(null); return; }
        resolve(res);
      };
      request.onerror = () => { closeDB(db); resolve(null); };
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
    return new Promise<void>((resolve) => {
      tx.oncomplete = () => { closeDB(db); resolve(); };
      tx.onerror = () => { closeDB(db); resolve(); };
    });
  } catch (e) {
    console.error('Clear Workspace Error:', e);
  }
};

export const clearAllWorkspaces = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    return new Promise<void>((resolve) => {
      tx.oncomplete = () => { closeDB(db); resolve(); };
      tx.onerror = () => { closeDB(db); resolve(); };
    });
  } catch (e) {
    console.error('Clear All Workspaces Error:', e);
  }
};
