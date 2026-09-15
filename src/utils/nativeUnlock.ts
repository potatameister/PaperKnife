import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { PdfUnlock } from '../plugins/pdfUnlock'

export const isNativeUnlockAvailable = () => Capacitor.isNativePlatform()

const bytesToBase64 = (data: Uint8Array): string => {
  const chunks: string[] = []
  const chunkSize = 0x8000
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(String.fromCharCode.apply(null, Array.from(data.subarray(i, i + chunkSize)) as any))
  }
  return btoa(chunks.join(''))
}

const base64ToBytes = (base64: string): Uint8Array => {
  const data = base64.includes(',') ? base64.split(',')[1] : base64
  const binaryString = window.atob(data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
  return bytes
}

/**
 * Real vector decrypt via the native PdfUnlock plugin (Android only).
 * Files cross the bridge by cache-dir handoff, never as giant JSON strings.
 */
export const nativeDecrypt = async (data: Uint8Array, password: string): Promise<{ bytes: Uint8Array, pages: number }> => {
  const stamp = Date.now()
  const inName = `unlock-in-${stamp}.pdf`
  const outName = `unlock-out-${stamp}.pdf`
  try {
    await Filesystem.writeFile({ path: inName, data: bytesToBase64(data), directory: Directory.Cache, recursive: true })
    let result
    try {
      result = await PdfUnlock.unlock({ name: inName, outName, password })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('INCORRECT_PASSWORD')) throw new Error('INCORRECT_PASSWORD')
      throw new Error(msg || 'Native unlock failed.')
    }
    const out = await Filesystem.readFile({ path: result.name, directory: Directory.Cache })
    return { bytes: base64ToBytes(out.data as string), pages: result.pages }
  } finally {
    try { await Filesystem.deleteFile({ path: inName, directory: Directory.Cache }) } catch { /* ignore */ }
    try { await Filesystem.deleteFile({ path: outName, directory: Directory.Cache }) } catch { /* ignore */ }
  }
}
