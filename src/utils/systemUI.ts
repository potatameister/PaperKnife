import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export async function setSystemUI(theme: 'light' | 'dark') {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setStyle({
      style: theme === 'dark' ? Style.Dark : Style.Light
    })
    
    await StatusBar.setBackgroundColor({
      color: theme === 'dark' ? '#000000' : '#FAFAFA'
    })

    await StatusBar.setOverlaysWebView({ overlay: false })
  } catch (e) {
    console.warn('StatusBar error:', e)
  }
}
