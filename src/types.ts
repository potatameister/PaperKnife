import { LucideIcon } from 'lucide-react'

export type Theme = 'light' | 'dark'
export type ViewMode = 'web' | 'android'

export interface Tool {
  title: string
  desc: string
  icon: LucideIcon
}
