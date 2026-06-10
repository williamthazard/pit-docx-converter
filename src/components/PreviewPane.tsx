import { useState } from 'react'

interface PreviewPaneProps {
  html: string
}

type Tab = 'preview' | 'source'

export function PreviewPane({ html }: PreviewPaneProps) {
  const [tab, setTab] = useState<Tab>('preview')

  const isEmpty = html.trim() === ''

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-pit-line bg-pit-card shadow-sm">
      <div className="flex items-center gap-1 border-b border-pit-line bg-pit-bg/40 p-1.5">
        {(['preview', 'source'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-pit-card text-pit-blue shadow-sm'
                : 'text-pit-grey-light hover:text-pit-grey'
            }`}
          >
            {t === 'preview' ? 'Preview' : 'HTML source'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto bg-pit-bg/40 p-4">
        {isEmpty ? (
          <p className="text-pit-grey-light">Document appears to be empty.</p>
        ) : tab === 'preview' ? (
          // WYSIWYG "page": render the inline-styled HTML on a white sheet so it
          // looks exactly as it will once pasted into Canvas, in either theme.
          // Safe: html came through cleanHtml() (DOMPurify) before styling.
          <div className="overflow-x-auto rounded-lg bg-white p-5 text-[#1a1a1a] shadow-sm ring-1 ring-black/5">
            <div className="prose-preview" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : (
          <pre className="overflow-auto rounded-lg bg-pit-bg p-4 font-mono text-[0.8rem] leading-relaxed break-words whitespace-pre-wrap text-pit-grey">
            {html}
          </pre>
        )}
      </div>
    </div>
  )
}
