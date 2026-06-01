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
    <div className="min-h-screen">
      <header className="border-b-4 border-pit-yellow bg-pit-card">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <img
            src={`${import.meta.env.BASE_URL}PIT_logo_blue.png`}
            alt="Pennsylvania Institute of Technology"
            className="h-12 w-auto"
          />
          <div className="border-l border-black/10 pl-4">
            <h1 className="font-heading text-xl text-pit-blue">Docx → Canvas HTML</h1>
            <p className="text-sm text-pit-grey-light">
              Turn a Word document into clean HTML for Canvas
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className={hasResult ? 'grid gap-6 md:grid-cols-[minmax(0,35%)_minmax(0,1fr)]' : 'mx-auto max-w-xl'}>
          <div className="flex flex-col gap-4">
            <Dropzone onFile={handleFile} fileName={fileName} />

            {busy && <p className="text-sm text-pit-grey-light">Converting…</p>}

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                <p className="font-semibold">{error.message}</p>
                {error.guidance && <p className="mt-1">{error.guidance}</p>}
              </div>
            )}

            {hasResult && (
              <>
                <ExportBar html={result.html} fileName={fileName} />
                <ConversionNotes notes={result.notes} warnings={result.warnings} />
              </>
            )}
          </div>

          {hasResult && (
            <div className="min-h-[60vh]">
              <PreviewPane html={result.html} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
