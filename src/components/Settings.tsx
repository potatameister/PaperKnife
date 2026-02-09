import { useState } from 'react'
import { 
  Trash2, Clock, Moon, Sun, Monitor,
  ChevronRight, Info, Zap, User, DownloadCloud, ListFilter,
  RotateCcw, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'
import { Theme } from '../types'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { hapticImpact } from '../utils/haptics'

const SettingItem = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  action, 
  onClick,
  danger 
}: { 
  icon: any, 
  title: string, 
  subtitle?: string, 
  action?: React.ReactNode,
  onClick?: () => void,
  danger?: boolean
}) => {
  const Container = onClick ? 'button' : 'div'
  return (
    <Container 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 transition-colors text-left ${onClick ? 'active:bg-gray-100 dark:active:bg-zinc-900 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-bold truncate ${danger ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium line-clamp-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onClick && !action && <ChevronRight size={18} className="text-gray-300" />}
      </div>
    </Container>
  )
}

const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-8">
    <h3 className="px-6 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">{title}</h3>
    <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border-y border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 shadow-sm">
      {children}
    </div>
  </div>
)

export default function Settings({ theme, setTheme }: { theme: Theme, setTheme: (t: Theme) => void }) {
  const navigate = useNavigate()
  
  const [autoWipe, setAutoWipe] = useState(localStorage.getItem('autoWipe') === 'true')
  const [wipeTimer, setWipeTimer] = useState(localStorage.getItem('autoWipeTimer') || '15')
  const [haptics, setHaptics] = useState(localStorage.getItem('hapticsEnabled') === 'true')
  const [autoDownload, setAutoDownload] = useState(localStorage.getItem('autoDownload') === 'true')
  const [historyLimit, setHistoryLimit] = useState(localStorage.getItem('historyLimit') || '10')
  const [defaultAuthor, setDefaultAuthor] = useState(localStorage.getItem('defaultAuthor') || '')

  const handleToggle = (key: string, currentVal: boolean, setter: (v: boolean) => void) => {
    const newVal = !currentVal
    localStorage.setItem(key, String(newVal))
    setter(newVal)
    hapticImpact()
    toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated`)
  }

  const handleSelect = (key: string, val: string, setter: (v: string) => void) => {
    localStorage.setItem(key, val)
    setter(val)
    hapticImpact()
    toast.success('Setting saved')
  }

  const restoreDefaults = () => {
    if (confirm("Restore all settings to factory defaults?")) {
      localStorage.clear()
      localStorage.setItem('theme', 'system')
      window.location.reload()
    }
  }

  return (
    <NativeToolLayout title="Settings" description="Application configuration" actions={null}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-32 -mx-4 md:mx-0">
        
        {/* Appearance */}
        <SettingGroup title="Appearance">
          <div className="p-4 grid grid-cols-3 gap-2 bg-white dark:bg-zinc-950">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as Theme)
                  hapticImpact()
                }}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${theme === t.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400'}`}
              >
                <t.icon size={18} />
                <span className="text-[10px] font-bold uppercase">{t.label}</span>
              </button>
            ))}
          </div>
          <SettingItem 
            icon={Zap} 
            title="Haptic Feedback" 
            subtitle="Vibrate on actions and success"
            action={
              <button 
                onClick={() => handleToggle('hapticsEnabled', haptics, setHaptics)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${haptics ? 'bg-rose-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${haptics ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            }
          />
        </SettingGroup>

        {/* Workflow */}
        <SettingGroup title="Workflow Defaults">
          <SettingItem 
            icon={DownloadCloud} 
            title="Auto-Download" 
            subtitle="Trigger save as soon as task finishes"
            action={
              <button 
                onClick={() => handleToggle('autoDownload', autoDownload, setAutoDownload)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${autoDownload ? 'bg-rose-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoDownload ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            }
          />
          <div className="p-5 bg-white dark:bg-zinc-950 space-y-4 border-t border-gray-50 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-500">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Default Author</h4>
                <p className="text-[10px] text-gray-500 mt-1">Pre-fill metadata fields</p>
                <input 
                  type="text"
                  value={defaultAuthor}
                  onChange={(e) => {
                    setDefaultAuthor(e.target.value)
                    localStorage.setItem('defaultAuthor', e.target.value)
                  }}
                  placeholder="Your name or company"
                  className="w-full mt-3 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-rose-500 transition-colors dark:text-white"
                />
              </div>
            </div>
          </div>
        </SettingGroup>

        {/* Security */}
        <SettingGroup title="Security & Privacy">
          <SettingItem 
            icon={Clock} 
            title="Auto-Wipe History" 
            subtitle="Clear logs after inactivity"
            action={
              <button 
                onClick={() => handleToggle('autoWipe', autoWipe, setAutoWipe)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${autoWipe ? 'bg-rose-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoWipe ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            }
          />
          {autoWipe && (
            <div className="p-4 px-6 bg-rose-50/30 dark:bg-rose-900/10 flex items-center justify-between border-t border-rose-100/20 dark:border-rose-900/20">
               <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Wipe Delay</span>
               <select 
                value={wipeTimer}
                onChange={(e) => handleSelect('autoWipeTimer', e.target.value, setWipeTimer)}
                className="bg-transparent text-xs font-black text-gray-900 dark:text-white outline-none appearance-none cursor-pointer"
               >
                  <option value="1">1 Minute</option>
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="0">Immediate</option>
               </select>
            </div>
          )}
          <div className="p-4 px-6 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-500">
                  <ListFilter size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none">History Limit</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Number of recent files to keep</p>
                </div>
             </div>
             <select 
              value={historyLimit}
              onChange={(e) => handleSelect('historyLimit', e.target.value, setHistoryLimit)}
              className="bg-transparent text-xs font-black text-rose-500 outline-none appearance-none cursor-pointer"
             >
                <option value="5">5 Files</option>
                <option value="10">10 Files</option>
                <option value="20">20 Files</option>
                <option value="50">50 Files</option>
                <option value="999">Unlimited</option>
             </select>
          </div>
          <SettingItem 
            icon={RotateCcw} 
            title="Restore Defaults" 
            subtitle="Reset all configuration" 
            onClick={restoreDefaults}
          />
          <SettingItem 
            icon={Trash2} 
            title="Nuke All Data" 
            subtitle="Wipe history and storage" 
            danger
            onClick={async () => {
              if(confirm("DANGER: This will delete ALL history and settings. Proceed?")) {
                await clearActivity()
                localStorage.clear()
                window.location.reload()
              }
            }}
          />
        </SettingGroup>

        {/* Application */}
        <SettingGroup title="Application">
          <SettingItem 
            icon={Info} 
            title="About PaperKnife" 
            subtitle="v0.5.0-beta • Active"
            onClick={() => navigate('/about')}
          />
          <SettingItem 
            icon={ShieldCheck} 
            title="Privacy Policy" 
            subtitle="Zero-data collection commitment"
            onClick={() => navigate('/privacy')}
          />
        </SettingGroup>

        <div className="flex flex-col items-center gap-2 py-10 opacity-20">
           <p className="text-[9px] font-black uppercase tracking-[0.5em]">PaperKnife Node v0.5.0-beta</p>
        </div>

      </div>
    </NativeToolLayout>
  )
}
