import { useState } from 'react'
import { 
  Trash2, Clock, Moon, Sun, Monitor,
  ChevronRight, Info, Zap, User, DownloadCloud, ListFilter,
  RotateCcw, ShieldCheck, Bug, Heart as HeartIcon, Settings2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'
import { Theme } from '../types'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { hapticImpact } from '../utils/haptics'

// --- Custom UI Components ---

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange() }}
    className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-gray-200 dark:bg-zinc-700'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

const SettingItem = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  action, 
  onClick,
  danger,
  iconColor
}: { 
  icon: any, 
  title: string, 
  subtitle?: string, 
  action?: React.ReactNode,
  onClick?: () => void,
  danger?: boolean,
  iconColor?: string
}) => {
  const Container = onClick ? 'button' : 'div'
  return (
    <Container 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 px-5 transition-all text-left group ${onClick ? 'active:bg-gray-50 dark:active:bg-white/5 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : (iconColor || 'bg-gray-100 dark:bg-zinc-800 text-gray-500 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20')}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-[13px] font-black truncate mb-0.5 tracking-tight ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-tight truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {action}
        {onClick && !action && <ChevronRight size={16} className="text-gray-300" />}
      </div>
    </Container>
  )
}

const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-zinc-600">{title}</h3>
    <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 shadow-sm overflow-hidden">
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
    toast.success('Configuration Saved')
  }

  const restoreDefaults = () => {
    if (confirm("Restore all settings to factory defaults?")) {
      localStorage.clear()
      localStorage.setItem('theme', 'system')
      window.location.reload()
    }
  }

  return (
    <NativeToolLayout title="System" description="Core Configuration" actions={null}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-40">
        
        {/* Integrated Header */}
        <div className="flex items-center gap-4 px-2 mb-8 mt-2">
           <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white shrink-0">
              <Settings2 size={24} strokeWidth={2.5} />
           </div>
           <div>
              <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">Preferences</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocol v1.0.0 • Local</p>
           </div>
        </div>

        {/* Visual Interface */}
        <SettingGroup title="Interface">
          <div className="p-2 grid grid-cols-3 gap-2">
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
                className={`flex flex-col items-center gap-2 py-3.5 rounded-[1.25rem] transition-all border border-transparent ${theme === t.id ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xl scale-[1.02]' : 'bg-gray-50 dark:bg-black/40 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                <t.icon size={18} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{t.label}</span>
              </button>
            ))}
          </div>
          <SettingItem 
            icon={Zap} 
            title="Haptic Feedback" 
            subtitle="Tactile Response Engine"
            action={<ToggleSwitch checked={haptics} onChange={() => handleToggle('hapticsEnabled', haptics, setHaptics)} />}
          />
        </SettingGroup>

        {/* Workflow Automation */}
        <SettingGroup title="Workflow">
          <SettingItem 
            icon={DownloadCloud} 
            title="Auto-Download" 
            subtitle="Immediate result export"
            action={<ToggleSwitch checked={autoDownload} onChange={() => handleToggle('autoDownload', autoDownload, setAutoDownload)} />}
          />
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
               <User size={16} className="text-rose-500" />
               <span className="text-[11px] font-black uppercase tracking-tight">Default Author Metadata</span>
            </div>
            <input 
              type="text"
              value={defaultAuthor}
              onChange={(e) => {
                setDefaultAuthor(e.target.value)
                localStorage.setItem('defaultAuthor', e.target.value)
              }}
              placeholder="e.g. potatameister"
              className="w-full bg-gray-100 dark:bg-black border border-transparent focus:border-rose-500 rounded-xl px-4 py-3.5 text-xs font-black outline-none transition-all placeholder:text-gray-400 dark:text-white"
            />
          </div>
        </SettingGroup>

        {/* Privacy Protocol */}
        <SettingGroup title="Privacy">
          <SettingItem 
            icon={Clock} 
            title="Auto-Wipe History" 
            subtitle="Automatic log destruction"
            action={<ToggleSwitch checked={autoWipe} onChange={() => handleToggle('autoWipe', autoWipe, setAutoWipe)} />}
          />
          {autoWipe && (
            <div className="px-5 py-3 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10 border-t border-rose-100/20 dark:border-rose-900/20 animate-in slide-in-from-top-2">
               <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Wipe Delay</span>
               <select 
                value={wipeTimer}
                onChange={(e) => handleSelect('autoWipeTimer', e.target.value, setWipeTimer)}
                className="bg-transparent text-[11px] font-black text-rose-600 outline-none cursor-pointer text-right"
               >
                  <option value="0">Immediately</option>
                  <option value="1">After 1 Minute</option>
                  <option value="5">After 5 Minutes</option>
                  <option value="15">After 15 Minutes</option>
                  <option value="30">After 30 Minutes</option>
               </select>
            </div>
          )}
          <div className="px-5 py-4 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500">
                  <ListFilter size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-gray-900 dark:text-white leading-none">History Limit</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">Files to keep</p>
                </div>
             </div>
             <select 
              value={historyLimit}
              onChange={(e) => handleSelect('historyLimit', e.target.value, setHistoryLimit)}
              className="bg-gray-100 dark:bg-black px-3 py-2 rounded-xl text-[11px] font-black text-gray-600 dark:text-gray-300 outline-none border border-transparent focus:border-rose-500 cursor-pointer"
             >
                <option value="5">5 Files</option>
                <option value="10">10 Files</option>
                <option value="20">20 Files</option>
                <option value="50">50 Files</option>
                <option value="999">Unlimited</option>
             </select>
          </div>
        </SettingGroup>

        {/* Ecosystem */}
        <SettingGroup title="Ecosystem">
          <SettingItem 
            icon={HeartIcon} 
            title="Sponsor Project" 
            subtitle="Fuel development"
            iconColor="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
            onClick={() => window.open('https://github.com/sponsors/potatameister', '_blank')}
          />
          <SettingItem 
            icon={Bug} 
            title="Report Issue" 
            subtitle="GitHub Tracker"
            onClick={() => window.open('https://github.com/potatameister/PaperKnife/issues', '_blank')}
          />
          <SettingItem 
            icon={Info} 
            title="About PaperKnife" 
            subtitle="Protocol Details"
            onClick={() => navigate('/about')}
          />
          <SettingItem 
            icon={ShieldCheck} 
            title="Privacy Protocol" 
            subtitle="Data Handling Spec"
            onClick={() => navigate('/privacy')}
          />
        </SettingGroup>

        {/* Danger Zone - Moved to absolute bottom */}
        <div className="mt-12">
           <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-red-500">Danger Zone</h3>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-red-100 dark:border-red-900/20 divide-y divide-red-50 dark:divide-red-900/10 shadow-sm overflow-hidden mb-4">
              <SettingItem 
                icon={RotateCcw} 
                title="Restore Defaults" 
                subtitle="Reset Preferences" 
                onClick={restoreDefaults}
                iconColor="text-gray-500 bg-gray-100 dark:bg-zinc-800"
              />
              <SettingItem 
                icon={Trash2} 
                title="Nuke All Data" 
                subtitle="Irreversible Wipedown" 
                danger
                onClick={async () => {
                  if(confirm("DANGER: This will permanently delete your history and reset all configuration. Proceed?")) {
                    await clearActivity()
                    localStorage.clear()
                    window.location.reload()
                  }
                }}
              />
           </div>
           <p className="text-[8px] font-black uppercase text-center text-gray-300 dark:text-zinc-700 tracking-[0.5em] mt-10">Configuration Engine v1.0.0 Stable</p>
        </div>

      </div>
    </NativeToolLayout>
  )
}
