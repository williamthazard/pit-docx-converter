import { useState } from 'react'
import { convertFile } from './lib/convert'
import type { ConversionResult } from './lib/types'
import { ConversionError } from './lib/types'
import { Dropzone } from './components/Dropzone'
import { PreviewPane } from './components/PreviewPane'
import { ExportBar } from './components/ExportBar'
import { ConversionNotes } from './components/ConversionNotes'

function App() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<{ message: string; guidance?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    setFileName(file.name)
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      setResult(await convertFile(file))
    } catch (e) {
      if (e instanceof ConversionError) {
        setError({ message: e.message, guidance: e.guidance })
      } else {
        setError({ message: "Couldn't read that file.", guidance: 'Try re-saving it, or use a different format.' })
        console.error(e)
      }
    } finally {
      setBusy(false)
    }
  }

  const hasResult = result !== null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-pit-line bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <img
            src={`${import.meta.env.BASE_URL}PIT_logo_blue.png`}
            alt="Pennsylvania Institute of Technology"
            className="h-11 w-auto"
          />
          <div className="border-l border-pit-line pl-4">
            <h1 className="font-heading text-xl leading-tight text-pit-ink">
              Docx <span className="text-pit-blue">→</span> Canvas HTML
            </h1>
            <p className="text-sm text-pit-grey-light">Turn a Word document into clean HTML for Canvas</p>
          </div>
        </div>
        <div className="h-[3px] bg-pit-yellow" />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div
          className={
            hasResult
              ? 'grid gap-6 md:grid-cols-[minmax(0,34%)_minmax(0,1fr)] md:items-start'
              : 'mx-auto max-w-xl'
          }
        >
          <div className="flex animate-fade-up flex-col gap-4">
            <Dropzone onFile={handleFile} fileName={fileName} />

            {busy && (
              <div className="flex items-center justify-center gap-2 text-sm text-pit-grey-light">
                <span className="spinner" aria-hidden="true" />
                Converting…
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                <ion-icon name="warning-outline" className="mt-0.5 shrink-0 text-base" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{error.message}</p>
                  {error.guidance && <p className="mt-0.5 text-red-700">{error.guidance}</p>}
                </div>
              </div>
            )}

            {hasResult && (
              <div className="flex flex-col gap-3 rounded-2xl border border-pit-line bg-pit-card p-4 shadow-sm">
                <p className="text-xs font-semibold tracking-wider text-pit-grey-light uppercase">Export</p>
                <ExportBar html={result.html} fileName={fileName} />
                <ConversionNotes notes={result.notes} warnings={result.warnings} />
              </div>
            )}
          </div>

          {hasResult && (
            <div className="min-h-[60vh] animate-fade-up md:[animation-delay:90ms]">
              <PreviewPane html={result.html} />
            </div>
          )}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pt-2 pb-8 text-center text-xs text-pit-grey-light">
        Pennsylvania Institute of Technology · Files are converted locally and never uploaded.
      </footer>
    </div>
  )
}

export default App
