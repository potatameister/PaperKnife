export interface ActivityEntry {
  id: string
  name: string
  tool: string
  timestamp: number
  size: number
  resultUrl?: string // Temporary session URL
  buffer?: Uint8Array // Persisted result bytes (dropped if > cap)
}

// Cap per-entry persisted bytes so history can't balloon IndexedDB
export const MAX_HISTORY_BUFFER_BYTES = 25 * 1024 * 1024

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
  const activity: ActivityEntry = {
    ...entry,
    // Never persist oversized buffers; keep the metadata row
    buffer: entry.buffer && entry.buffer.byteLength > MAX_HISTORY_BUFFER_BYTES ? undefined : entry.buffer,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  }

  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(activity)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })

  // Cleanup: respect user setting (separate tx, no race)
  try {
    const limitSetting = localStorage.getItem('historyLimit')
    const limit = limitSetting === '999' ? 999999 : parseInt(limitSetting || '10')

    const all = await new Promise<ActivityEntry[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as ActivityEntry[])
      req.onerror = () => resolve([])
    })
    if (all.length > limit) {
      const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
      const oldest = sorted.slice(limit)
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        oldest.forEach(o => store.delete(o.id))
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      })
    }
  } catch { /* ignore cleanup errors */ }
  try { db.close() } catch { /* ignore */ }
}

export const getRecentActivity = async (limit = 10): Promise<ActivityEntry[]> => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const results = request.result as ActivityEntry[]
      try { db.close() } catch { /* ignore */ }
      resolve(results.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit))
    }
    request.onerror = () => {
      try { db.close() } catch { /* ignore */ }
      resolve([])
    }
  })
}

export const clearActivity = async () => {
  const db = await openDB()
  return new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => { try { db.close() } catch { /* ignore */ }; resolve() }
    tx.onerror = () => { try { db.close() } catch { /* ignore */ }; resolve() }
  })
}

export const deleteActivity = async (id: string) => {
  const db = await openDB()
  return new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => { try { db.close() } catch { /* ignore */ }; resolve() }
    tx.onerror = () => { try { db.close() } catch { /* ignore */ }; resolve() }
  })
}

export const updateLastSeen = () => {
  localStorage.setItem('lastSeen', String(Date.now()))
}

export const getLastSeen = () => {
  return Number(localStorage.getItem('lastSeen') || '0')
}
