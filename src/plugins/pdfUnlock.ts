import { registerPlugin } from '@capacitor/core'

export interface PdfUnlockPlugin {
  unlock(opts: { name: string, outName: string, password: string }): Promise<{ name: string, pages: number }>
}

export const PdfUnlock = registerPlugin<PdfUnlockPlugin>('PdfUnlock')
