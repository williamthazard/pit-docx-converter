import { useRef, useState } from 'react'
import { ACCEPTED_EXTENSIONS } from '../lib/convert'

interface DropzoneProps {
  onFile: (file: File) => void
  fileName: string | null
}

export function Dropzone({ onFile, fileName }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onFile(files[0])
  }

  function openPicker() {
    inputRef.current?.click()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        fileName
          ? `Loaded ${fileName}. Activate to choose a different file.`
          : 'Choose or drop a .docx, .txt, or .pdf file to convert'
      }
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPicker()
        }
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pit-blue focus-visible:ring-offset-2 ${
        dragging
          ? 'scale-[1.01] border-pit-blue bg-pit-blue/[0.06] shadow-lg shadow-pit-blue/10'
          : 'border-pit-blue/35 bg-white/70 hover:border-pit-blue hover:bg-white hover:shadow-md hover:shadow-pit-blue/5'
      }`}
    >
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          // Reset so re-selecting the same filename still fires a change event.
          e.target.value = ''
        }}
      />

      <span
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
          fileName ? 'bg-pit-blue text-white' : 'bg-pit-blue/10 text-pit-blue group-hover:bg-pit-blue/15'
        }`}
      >
        <ion-icon
          name={fileName ? 'checkmark-circle-outline' : 'cloud-upload-outline'}
          className="text-[26px]"
          aria-hidden="true"
        />
      </span>

      {fileName ? (
        <>
          <p className="font-heading text-lg text-pit-ink">
            <span className="text-pit-grey-light">Loaded:</span> {fileName}
          </p>
          <p className="mt-1 text-sm text-pit-grey-light">Click or drop another file to replace</p>
        </>
      ) : (
        <>
          <p className="font-heading text-lg text-pit-ink">Drop a document here</p>
          <p className="mt-1 text-sm text-pit-grey-light">or click to choose a file</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {ACCEPTED_EXTENSIONS.map((ext) => (
              <span
                key={ext}
                className="rounded-full border border-pit-line bg-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-pit-grey-light"
              >
                {ext.replace('.', '')}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
