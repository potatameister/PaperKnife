export interface ActivityEntry {
  id: string
  name: string
  tool: string
  timestamp: number
  size: number
  resultUrl?: string // Temporary session URL
}

const DB_NAME = 'PaperKnifeDB'
const STORE_NAME = 'activity'
const DB_VERSION = 1

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
  
  // Cleanup: keep only last 10
  const all = await getRecentActivity(20)
  if (all.length > 10) {
    const oldest = all.slice(10)
    oldest.forEach(o => store.delete(o.id))
  }
}

export const getRecentActivity = async (limit = 10): Promise<ActivityEntry[]> => {
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
