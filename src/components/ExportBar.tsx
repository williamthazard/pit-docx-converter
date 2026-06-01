import { useState } from 'react'

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
  const disabled = html.trim() === ''

  function announce(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 1500)
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html)
    announce('Copied HTML source')
  }

  async function copyRich() {
    const item = new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })
    await navigator.clipboard.write([item])
    announce('Copied rich content')
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

  const base = 'rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col gap-2">
      <button onClick={copyHtml} disabled={disabled} className={`${base} bg-pit-yellow text-pit-grey hover:bg-pit-yellow-dark`}>
        Copy HTML
      </button>
      <button onClick={copyRich} disabled={disabled} className={`${base} bg-pit-blue text-white hover:bg-pit-blue-dark`}>
        Copy rich
      </button>
      <button onClick={download} disabled={disabled} className={`${base} border border-pit-blue text-pit-blue hover:bg-pit-blue/5`}>
        Download .html
      </button>
      <span className="h-4 text-xs text-pit-grey-light">{flash}</span>
    </div>
  )
}
