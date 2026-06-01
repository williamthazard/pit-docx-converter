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
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pit-blue focus-visible:ring-offset-2 ${
        dragging ? 'border-pit-blue bg-pit-blue/5' : 'border-pit-blue/50 bg-pit-card'
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
      <p className="font-heading text-lg text-pit-blue">
        {fileName ? `Loaded: ${fileName}` : 'Drop a .docx, .txt, or .pdf'}
      </p>
      <p className="mt-1 text-sm text-pit-grey-light">
        {fileName ? 'Click to replace' : 'or click to choose a file'}
      </p>
    </div>
  )
}
