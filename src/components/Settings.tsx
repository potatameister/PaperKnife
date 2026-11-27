import { useState } from 'react'
import { 
  Trash2, Clock, Moon, Sun, Monitor,
  ChevronRight, Info, Zap, User, DownloadCloud, ListFilter,
  RotateCcw, ShieldCheck, Bug, Languages, Heart as HeartIcon, Github as GHIcon, Trophy as TrophyIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'
import { Theme } from '../types'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { TabHeader } from './AndroidHeader'
import { PaperKnifeLogo } from './Logo'
import { hapticImpact } from '../utils/haptics'
import { t, language, setLanguage, LANGUAGES, Language } from '../i18n'

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
    toast.success(t('{0} updated', t(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))))
  }

  const handleSelect = (key: string, val: string, setter: (v: string) => void) => {
    localStorage.setItem(key, val)
    setter(val)
    hapticImpact()
    toast.success(t('Configuration Saved'))
  }

  const restoreDefaults = () => {
    if (confirm(t("Restore all settings to factory defaults?"))) {
      localStorage.clear()
      localStorage.setItem('theme', 'system')
      window.location.reload()
    }
  }

  return (
    <NativeToolLayout title={t("Settings")} description={t("Core Configuration")} actions={null} hideNativeHeader>
      <div className="md:hidden -mx-4 -mt-4">
        <TabHeader title={t("Settings")} />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-40">

        {/* Identity card */}
        <div className="mb-8 p-5 bg-zinc-950 dark:bg-white rounded-[2rem] flex items-center gap-4 shadow-xl overflow-hidden relative">
          <div className="w-12 h-12 bg-white dark:bg-zinc-950 rounded-2xl flex items-center justify-center shrink-0">
            <PaperKnifeLogo size={24} iconColor="#F43F5E" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white dark:text-black tracking-tighter leading-none mb-1">PaperKnife</h2>
            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("Private by design • No servers")}</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white dark:text-black bg-white/10 dark:bg-black/10 rounded-full px-3 py-1.5 shrink-0">v1.1.0</span>
        </div>

        {/* Appearance */}
        <SettingGroup title={t("Appearance")}>
          <div className="p-2 grid grid-cols-3 gap-2">
            {[
              { id: 'light', icon: Sun, label: t("Light") },
              { id: 'dark', icon: Moon, label: t("Dark") },
              { id: 'system', icon: Monitor, label: t("System") }
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
            title={t("Haptic Feedback")}
            subtitle={t("Vibrate when tapping buttons")}
            action={<ToggleSwitch checked={haptics} onChange={() => handleToggle('hapticsEnabled', haptics, setHaptics)} />}
          />
          <SettingItem
            icon={Languages}
            title={t("Language")}
            subtitle={t("App display language")}
            action={
              <select
                value={language}
                onChange={(e) => { hapticImpact(); setLanguage(e.target.value as Language) }}
                aria-label={t("Language")}
                className="bg-transparent text-[11px] font-black text-rose-600 outline-none cursor-pointer text-right"
              >
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            }
          />
        </SettingGroup>

        {/* Automation */}
        <SettingGroup title={t("Automation")}>
          <SettingItem
            icon={DownloadCloud}
            title={t("Auto-Download")}
            subtitle={t("Save results automatically")}
            action={<ToggleSwitch checked={autoDownload} onChange={() => handleToggle('autoDownload', autoDownload, setAutoDownload)} />}
          />
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
               <User size={16} className="text-rose-500" />
               <span className="text-[11px] font-black uppercase tracking-tight">{t("Default Author")}</span>
            </div>
            <input 
              type="text"
              value={defaultAuthor}
              onChange={(e) => {
                setDefaultAuthor(e.target.value)
                localStorage.setItem('defaultAuthor', e.target.value)
              }}
              placeholder={t("e.g. potatameister")}
              className="w-full bg-gray-100 dark:bg-black border border-transparent focus:border-rose-500 rounded-xl px-4 py-3.5 text-xs font-black outline-none transition-all placeholder:text-gray-400 dark:text-white"
            />
          </div>
        </SettingGroup>

        {/* Privacy Protocol */}
        <SettingGroup title={t("Privacy")}>
          <SettingItem
            icon={Clock}
            title={t("Auto-Wipe History")}
            subtitle={t("Delete history automatically")}
            action={<ToggleSwitch checked={autoWipe} onChange={() => handleToggle('autoWipe', autoWipe, setAutoWipe)} />}
          />
          {autoWipe && (
            <div className="px-5 py-3 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10 border-t border-rose-100/20 dark:border-rose-900/20 animate-in slide-in-from-top-2">
               <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{t("Delete After")}</span>
               <select 
                value={wipeTimer}
                onChange={(e) => handleSelect('autoWipeTimer', e.target.value, setWipeTimer)}
                className="bg-transparent text-[11px] font-black text-rose-600 outline-none cursor-pointer text-right"
               >
                  <option value="0">{t("Immediately")}</option>
                  <option value="1">{t("After 1 Minute")}</option>
                  <option value="5">{t("After 5 Minutes")}</option>
                  <option value="15">{t("After 15 Minutes")}</option>
                  <option value="30">{t("After 30 Minutes")}</option>
               </select>
            </div>
          )}
          <div className="px-5 py-4 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500">
                  <ListFilter size={18} />
                </div>
                <div>
                   <h4 className="text-[13px] font-black text-gray-900 dark:text-white leading-none">{t("History Limit")}</h4>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">{t("Maximum entries kept")}</p>
                </div>
             </div>
             <select 
              value={historyLimit}
              onChange={(e) => handleSelect('historyLimit', e.target.value, setHistoryLimit)}
              className="bg-gray-100 dark:bg-black px-3 py-2 rounded-xl text-[11px] font-black text-gray-600 dark:text-gray-300 outline-none border border-transparent focus:border-rose-500 cursor-pointer"
             >
                <option value="5">{t("5 Files")}</option>
                <option value="10">{t("10 Files")}</option>
                <option value="20">{t("20 Files")}</option>
                <option value="50">{t("50 Files")}</option>
                <option value="999">{t("Unlimited")}</option>
             </select>
          </div>
        </SettingGroup>

        {/* Support */}
        <SettingGroup title={t("Support")}>
          <SettingItem
            icon={HeartIcon}
            title={t("Support PaperKnife")}
            subtitle={t("Help, contact, and sponsor")}
            iconColor="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
            onClick={() => window.open('https://potatameister.github.io/support', '_blank')}
          />
          <SettingItem
            icon={GHIcon}
            title={t("Source Code")}
            subtitle={t("Audit the app yourself")}
            iconColor="bg-zinc-950 text-white dark:bg-white dark:text-black"
            onClick={() => window.open('https://github.com/potatameister/PaperKnife', '_blank')}
          />
          <SettingItem
            icon={TrophyIcon}
            title={t("Hall of Fame")}
            subtitle={t("Supporters and contributors")}
            iconColor="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
            onClick={() => navigate('/thanks')}
          />
          <SettingItem
            icon={Bug}
            title={t("Report Issue")}
            subtitle={t("Report a problem")}
            onClick={() => window.open('https://github.com/potatameister/PaperKnife/issues', '_blank')}
          />
          <SettingItem
            icon={Info}
            title={t("About PaperKnife")}
            subtitle={t("About this app")}
            onClick={() => navigate('/about')}
          />
          <SettingItem
            icon={ShieldCheck}
            title={t("Privacy Protocol")}
            subtitle={t("How your data is handled")}
            onClick={() => window.open('https://potatameister.github.io/privacy/paperknife', '_blank')}
          />
        </SettingGroup>

        {/* Danger Zone - Moved to absolute bottom */}
        <div className="mt-12">
           <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-red-500">{t("Danger Zone")}</h3>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-red-100 dark:border-red-900/20 divide-y divide-red-50 dark:divide-red-900/10 shadow-sm overflow-hidden mb-4">
              <SettingItem
                icon={RotateCcw}
                title={t("Restore Defaults")}
                subtitle={t("Reset all settings")}
                onClick={restoreDefaults}
                iconColor="text-gray-500 bg-gray-100 dark:bg-zinc-800"
              />
              <SettingItem
                icon={Trash2}
                title={t("Erase All Data")}
                subtitle={t("Cannot be undone")}
                danger
                onClick={async () => {
                  if(confirm(t("This will permanently delete your history and reset all settings. Proceed?"))) {
                    await clearActivity()
                    try { (await import('../utils/workspacePersistence')).clearAllWorkspaces(); } catch { /* ignore */ }
                    localStorage.clear()
                    window.location.reload()
                  }
                }}
              />
           </div>
           <p className="text-[8px] font-black uppercase text-center text-gray-300 dark:text-zinc-700 tracking-[0.5em] mt-10">PaperKnife v1.1.0</p>
        </div>

      </div>
    </NativeToolLayout>
  )
}
