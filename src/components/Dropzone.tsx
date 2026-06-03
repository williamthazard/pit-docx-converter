import { useState } from 'react'
import { ACCEPTED_EXTENSIONS } from '../lib/convert'
import { Icon } from './Icon'
import { cloudUploadOutline, checkmarkCircleOutline } from '../icons'

interface DropzoneProps {
  onFile: (file: File) => void
  fileName: string | null
}

export function Dropzone({ onFile, fileName }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onFile(files[0])
  }

  // The real <input type="file"> is an invisible overlay covering the whole
  // zone, so a click anywhere IS a direct click on the input — the browser
  // opens the native dialog with no programmatic .click() or <label> forwarding
  // (both of which some browsers refuse for a hidden input). It stays a focusable
  // control (keyboard: Tab → Enter) and handles drag-and-drop directly.
  return (
    <div
      className={`group relative rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pit-blue has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-pit-bg ${
        dragging
          ? 'scale-[1.01] border-pit-blue bg-pit-blue/[0.06] shadow-lg shadow-pit-blue/10'
          : 'border-pit-blue/35 bg-pit-card/70 hover:border-pit-blue hover:bg-pit-card hover:shadow-md hover:shadow-pit-blue/5'
      }`}
    >
      <input
        data-testid="file-input"
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        aria-label={
          fileName
            ? `Loaded ${fileName}. Choose a different file.`
            : 'Choose or drop a Word .docx file to convert'
        }
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onChange={(e) => {
          handleFiles(e.target.files)
          // Reset so re-selecting the same filename still fires a change event.
          e.target.value = ''
        }}
      />

      <div className="pointer-events-none relative flex flex-col items-center">
        <span
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            fileName
              ? 'bg-pit-blue text-white'
              : 'bg-pit-blue/10 text-pit-blue group-hover:bg-pit-blue/15 dark:bg-pit-blue/20 dark:text-pit-blue-light'
          }`}
        >
          <Icon icon={fileName ? checkmarkCircleOutline : cloudUploadOutline} className="text-[26px]" />
        </span>

        {fileName ? (
          <>
            <p className="font-heading text-lg break-words text-pit-ink">
              <span className="text-pit-grey-light">Loaded:</span> {fileName}
            </p>
            <p className="mt-1 text-sm text-pit-grey-light">Click or drop another file to replace</p>
          </>
        ) : (
          <>
            <p className="font-heading text-lg text-pit-ink">Drop a Word document here</p>
            <p className="mt-1 text-sm text-pit-grey-light">or click to choose a .docx file</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {ACCEPTED_EXTENSIONS.map((ext) => (
                <span
                  key={ext}
                  className="rounded-full border border-pit-line bg-pit-card px-2.5 py-0.5 text-xs font-semibold tracking-wide text-pit-grey-light uppercase"
                >
                  {ext.replace('.', '')}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
