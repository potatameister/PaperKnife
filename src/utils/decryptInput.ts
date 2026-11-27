import { Capacitor } from '@capacitor/core'
import { PDFDocument } from 'pdf-lib'
import { nativeDecrypt } from './nativeUnlock'
import { IS_UNLOCK_WASM_DISABLED, qpdfDecrypt } from './qpdfUnlock'
import { t } from '../i18n'

/**
 * Real vector decrypt of locked input bytes (native plugin on Android,
 * qpdf WASM on web). Replaces the old password+ignoreEncryption reload
 * which faked success (issues #30, #60).
 *
 * Throws named Errors only — never raw engine text, never hangs:
 * - `Incorrect password for "name".`
 * - `"name" could not be unlocked on this device.` (native fail)
 * - `"name" could not be unlocked (...)` (web fail)
 * - `Unlock engine missing for "name".` (engine stripped)
 * - `"name" unlocked copy failed verification.` (bad output bytes)
 */
export const decryptInput = async (data: Uint8Array, password: string, label: string): Promise<Uint8Array> => {
  let pdfBytes: Uint8Array
  if (Capacitor.isNativePlatform()) {
    try {
      pdfBytes = (await nativeDecrypt(data, password)).bytes
    } catch (e: any) {
      if (e?.message === 'INCORRECT_PASSWORD') throw new Error(t("Incorrect password for \"{0}\".", label))
      throw new Error(t("\"{0}\" could not be unlocked on this device.", label))
    }
  } else {
    if (IS_UNLOCK_WASM_DISABLED) throw new Error(t("Unlock engine missing for \"{0}\".", label))
    try {
      pdfBytes = await qpdfDecrypt(data, password)
    } catch (e: any) {
      if (e?.message === 'INCORRECT_PASSWORD') throw new Error(t("Incorrect password for \"{0}\".", label))
      throw new Error(t('"{0}" could not be unlocked ({1}).', label, e?.message || t("unsupported file")))
    }
  }
  try {
    await PDFDocument.load(pdfBytes, { throwOnInvalidObject: false } as any)
  } catch {
    throw new Error(t("\"{0}\" unlocked copy failed verification.", label))
  }
  return pdfBytes
}

/**
 * Clean bytes for processing. Open files pass through byte-identical;
 * locked files (password present from preview-unlock) are decrypted first.
 */
export const getProcessBytes = async (file: File, password?: string): Promise<Uint8Array> => {
  const raw = new Uint8Array(await file.arrayBuffer())
  if (!password) return raw
  return decryptInput(raw, password, file.name)
}
