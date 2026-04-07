/**
 * PaperKnife - Universal Secure PDF Gate
 * Copyright (C) 2026 potatameister
 */

import React, { useState } from 'react'
import { Lock, Unlock, Loader2, X, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PdfUnlocker } from '../../utils/pdfUnlocker'

interface SecurePDFGateProps {
  /**
   * The encrypted file dropped by the user
   */
  file: File | null
  /**
   * Callback when the file is successfully unlocked
   */
  onUnlocked: (unlockedBuffer: Uint8Array, originalFile: File) => void
  /**
   * Callback to reset or clear the file
   */
  onCancel: () => void
  /**
   * Children will be shown when NO file is present
   */
  children?: React.ReactNode
}

export const SecurePDFGate: React.FC<SecurePDFGateProps> = ({ file, onUnlocked, onCancel, children }) => {
  const [password, setPassword] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isEncrypted, setIsEncrypted] = useState(false)

  // Detect encryption as soon as file is provided
  React.useEffect(() => {
    if (!file) {
      setIsEncrypted(false)
      return
    }

    const check = async () => {
      setIsChecking(true)
      try {
        const buffer = new Uint8Array(await file.slice(0, 4096).arrayBuffer())
        const content = new TextDecoder().decode(buffer)
        const locked = content.includes('/Encrypt')
        setIsEncrypted(locked)
        
        if (!locked) {
          // If not encrypted, just pass the buffer through immediately
          const fullBuffer = new Uint8Array(await file.arrayBuffer())
          onUnlocked(fullBuffer, file)
        }
      } catch (e) {
        console.error('File check failed:', e)
        setIsEncrypted(false)
      } finally {
        setIsChecking(false)
      }
    }

    check()
  }, [file])

  const handleUnlock = async () => {
    if (!file || !password) return
    setIsUnlocking(true)
    try {
      const fullBuffer = new Uint8Array(await file.arrayBuffer())
      const result = await PdfUnlocker.unlock(fullBuffer, password)
      
      if (result.success && result.data) {
        toast.success('File Unlocked Successfully')
        onUnlocked(result.data, file)
      } else {
        if (result.error === 'INCORRECT_PASSWORD') {
           toast.error('Incorrect Password')
        } else {
           toast.error('Decryption failed. The file may use unsupported encryption.')
        }
      }
    } catch (e) {
      console.error('Unlock error:', e)
      toast.error('An unexpected error occurred.')
    } finally {
      setIsUnlocking(false)
    }
  }

  if (!file) return <>{children}</>

  if (isChecking) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-[2.5rem] animate-pulse">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase text-gray-400">Verifying Security...</p>
      </div>
    )
  }

  if (isEncrypted) {
    return (
      <div className="max-w-md mx-auto relative z-[100] animate-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl text-center relative overflow-hidden">
          
          {/* Subtle Background Icon */}
          <div className="absolute top-[-20px] right-[-20px] text-gray-50 dark:text-white/5 opacity-50">
             <Lock size={120} />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              {isUnlocking ? <Loader2 className="animate-spin" size={32} /> : <Lock size={32} />}
            </div>
            
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Protected Document</h3>
            <p className="text-xs text-gray-400 mb-8 max-w-[200px] mx-auto">This file is encrypted. Enter the password to unlock it for processing.</p>

            <div className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master Password"
                className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center dark:text-white shadow-inner transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              
              <button 
                onClick={handleUnlock}
                disabled={!password || isUnlocking}
                className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isUnlocking ? 'Unlocking...' : 'Unlock & Proceed'}
              </button>

              <button 
                onClick={onCancel}
                className="text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors pt-2"
              >
                Cancel and pick another file
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If not encrypted, we show nothing (it passes through immediately via useEffect)
  return (
    <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-[2.5rem]">
      <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
    </div>
  )
}
