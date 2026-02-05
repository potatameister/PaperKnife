import { LucideIcon } from 'lucide-react'

export type Theme = 'light' | 'dark'
export type ViewMode = 'web' | 'android'

export type ToolCategory = 'Edit' | 'Secure' | 'Convert' | 'Optimize'

export interface Tool {
  title: string
  desc: string
  icon: LucideIcon
  implemented?: boolean
  path?: string
  category: ToolCategory
}