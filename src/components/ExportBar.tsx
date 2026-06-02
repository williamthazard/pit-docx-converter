import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { codeSlashOutline, clipboardOutline, downloadOutline, checkmarkOutline } from '../icons'

interface ExportBarProps {
  html: string
  fileName: string | null
}

function downloadName(fileName: string | null): string {
  if (!fileName) return 'converted.html'
  const dot = fileName.lastIndexOf('.')
  const stem = dot === -1 ? fileName : fileName.slice(0, dot)
  return `${stem}.html`
}

export function ExportBar({ html, fileName }: ExportBarProps) {
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const disabled = html.trim() === ''

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  function announce(msg: string) {
    setFlash(msg)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 1800)
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html)
      announce('Copied HTML source')
    } catch {
      announce('Copy failed — check clipboard permissions')
    }
  }

  async function copyRich() {
    try {
      const item = new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })
      await navigator.clipboard.write([item])
      announce('Copied rich content')
    } catch {
      announce('Copy failed — check clipboard permissions')
    }
  }

  function download() {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName(fileName)
    a.click()
    URL.revokeObjectURL(url)
    announce('Downloaded')
  }

  const btn =
    'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed enabled:active:scale-[0.98]'

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={copyHtml}
        disabled={disabled}
        className={`${btn} bg-pit-yellow text-[#15294a] shadow-sm enabled:hover:bg-pit-yellow-dark enabled:hover:shadow`}
      >
        <Icon icon={codeSlashOutline} className="text-lg" /> Copy HTML
      </button>
      <button
        onClick={copyRich}
        disabled={disabled}
        className={`${btn} bg-pit-blue text-white shadow-sm enabled:hover:bg-pit-blue-dark enabled:hover:shadow`}
      >
        <Icon icon={clipboardOutline} className="text-lg" /> Copy rich
      </button>
      <button
        onClick={download}
        disabled={disabled}
        className={`${btn} border border-pit-blue/40 bg-pit-card text-pit-blue enabled:hover:border-pit-blue enabled:hover:bg-pit-blue/[0.06] dark:text-pit-blue-light`}
      >
        <Icon icon={downloadOutline} className="text-lg" /> Download .html
      </button>
      <span
        aria-live="polite"
        className={`flex h-5 items-center gap-1.5 text-xs font-medium text-pit-blue transition-opacity ${
          flash ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {flash && <Icon icon={checkmarkOutline} className="text-sm" />}
        {flash}
      </span>
    </div>
  )
}
