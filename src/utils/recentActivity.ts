export interface ActivityEntry {
  id: string
  name: string
  tool: string
  timestamp: number
  size: number
  resultUrl?: string // Temporary session URL (deprecated)
  buffer?: ArrayBuffer | Uint8Array // Stored file data for persistence
}

const DB_NAME = 'PaperKnifeDB'
const STORE_NAME = 'activity'
const DB_VERSION = 2 // Incremented to handle buffer field

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const addActivity = async (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  
  const activity: ActivityEntry = {
    ...entry,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  }
  
  await store.add(activity)
  
  // Cleanup: respect user setting
  const limitSetting = localStorage.getItem('historyLimit')
  const limit = limitSetting === '999' ? 999999 : parseInt(limitSetting || '20')
  
  const request = store.getAll()
  request.onsuccess = () => {
    const results = request.result as ActivityEntry[]
    if (results.length > limit) {
      const sorted = results.sort((a, b) => b.timestamp - a.timestamp)
      const oldest = sorted.slice(limit)
      const deleteTx = db.transaction(STORE_NAME, 'readwrite')
      const deleteStore = deleteTx.objectStore(STORE_NAME)
      oldest.forEach(o => deleteStore.delete(o.id))
    }
  }
}

export const getRecentActivity = async (limit = 20): Promise<ActivityEntry[]> => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  
  return new Promise((resolve) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const results = request.result as ActivityEntry[]
      resolve(results.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit))
    }
  })
}

export const clearActivity = async () => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  await store.clear()
}

export const deleteActivityItem = async (id: string) => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  await store.delete(id)
}

export const updateLastSeen = () => {
  localStorage.setItem('lastSeen', String(Date.now()))
}

export const getLastSeen = () => {
  return Number(localStorage.getItem('lastSeen') || '0')
}

export const createBlobUrl = (buffer: ArrayBuffer | Uint8Array, _fileName: string): string => {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}
