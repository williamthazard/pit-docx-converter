import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { sunnyOutline, moonOutline, desktopOutline, checkmarkOutline } from '../icons'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

function getStoredTheme(): Theme {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

const OPTIONS = [
  { value: 'light', icon: sunnyOutline, label: 'Light' },
  { value: 'dark', icon: moonOutline, label: 'Dark' },
  { value: 'system', icon: desktopOutline, label: 'System' },
] as const

export function ThemeMenu() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Apply + persist the theme; follow live OS changes only in "system" mode.
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}. Change theme.`}
        title="Change theme"
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/90 transition-colors hover:bg-white/15"
      >
        <Icon icon={current.icon} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-pit-line bg-pit-card py-1 shadow-lg"
        >
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === o.value}
              onClick={() => {
                setTheme(o.value)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-pit-blue/10 ${
                theme === o.value
                  ? 'font-semibold text-pit-blue dark:text-pit-blue-light'
                  : 'text-pit-grey'
              }`}
            >
              <Icon icon={o.icon} className="text-base" />
              <span className="flex-1">{o.label}</span>
              {theme === o.value && <Icon icon={checkmarkOutline} className="text-base" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
