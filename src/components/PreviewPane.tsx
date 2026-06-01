import { useState } from 'react'

interface PreviewPaneProps {
  html: string
}

type Tab = 'preview' | 'source'

export function PreviewPane({ html }: PreviewPaneProps) {
  const [tab, setTab] = useState<Tab>('preview')

  const isEmpty = html.trim() === ''

  return (
    <div className="flex h-full flex-col rounded-xl border border-black/10 bg-pit-card">
      <div className="flex gap-1 border-b border-black/10 p-2">
        {(['preview', 'source'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${
              tab === t ? 'bg-pit-blue text-white' : 'text-pit-grey hover:bg-black/5'
            }`}
          >
            {t === 'preview' ? 'Preview' : 'HTML source'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isEmpty ? (
          <p className="text-pit-grey-light">Document appears to be empty.</p>
        ) : tab === 'preview' ? (
          <div
            className="prose-preview"
            // Safe: this html came through cleanHtml(), which runs DOMPurify
            // (scripts/event-handlers/javascript: URLs removed) before display.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="whitespace-pre-wrap break-all text-sm text-pit-grey">{html}</pre>
        )}
      </div>
    </div>
  )
}
