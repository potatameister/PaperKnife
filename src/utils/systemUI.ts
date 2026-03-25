import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { NavigationBar } from '@capgo/capacitor-navigation-bar'

export async function setSystemUI(theme: 'light' | 'dark') {
  if (!Capacitor.isNativePlatform()) return

  try {
    // 1. Status Bar (Top)
    await StatusBar.setStyle({
      style: theme === 'dark' ? Style.Dark : Style.Light
    })
    
    await StatusBar.setBackgroundColor({
      color: theme === 'dark' ? '#000000' : '#FAFAFA'
    })

    // Ensuring the app content draws behind the status bar if needed, 
    // but the pt-safe class will handle the padding.
    await StatusBar.setOverlaysWebView({ overlay: true })

    // 2. Navigation Bar (Bottom)
    await NavigationBar.setNavigationBarColor({
      color: theme === 'dark' ? '#000000' : '#FAFAFA',
      darkButtons: theme === 'light' // Dark icons for light theme
    })

  } catch (e) {
    console.warn('SystemUI error:', e)
  }
}
