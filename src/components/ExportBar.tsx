import { useEffect, useRef, useState } from 'react'

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
        className={`${btn} bg-pit-yellow text-pit-ink shadow-sm enabled:hover:bg-pit-yellow-dark enabled:hover:shadow`}
      >
        <ion-icon name="code-slash-outline" className="text-lg" aria-hidden="true" /> Copy HTML
      </button>
      <button
        onClick={copyRich}
        disabled={disabled}
        className={`${btn} bg-pit-blue text-white shadow-sm enabled:hover:bg-pit-blue-dark enabled:hover:shadow`}
      >
        <ion-icon name="clipboard-outline" className="text-lg" aria-hidden="true" /> Copy rich
      </button>
      <button
        onClick={download}
        disabled={disabled}
        className={`${btn} border border-pit-blue/40 bg-white text-pit-blue enabled:hover:border-pit-blue enabled:hover:bg-pit-blue/[0.04]`}
      >
        <ion-icon name="download-outline" className="text-lg" aria-hidden="true" /> Download .html
      </button>
      <span
        aria-live="polite"
        className={`flex h-5 items-center gap-1.5 text-xs font-medium text-pit-blue transition-opacity ${
          flash ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {flash && <ion-icon name="checkmark-outline" className="text-sm" aria-hidden="true" />}
        {flash}
      </span>
    </div>
  )
}
