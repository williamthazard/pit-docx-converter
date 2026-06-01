interface ConversionNotesProps {
  notes: string[]
  warnings: string[]
}

export function ConversionNotes({ notes, warnings }: ConversionNotesProps) {
  if (notes.length === 0 && warnings.length === 0) return null
  return (
    <div className="flex flex-col gap-2 text-sm">
      {warnings.map((w, i) => (
        <p key={`w${i}`} className="rounded-md bg-pit-yellow/20 px-3 py-2 text-pit-grey">⚠ {w}</p>
      ))}
      {notes.map((n, i) => (
        <p key={`n${i}`} className="rounded-md bg-pit-blue/10 px-3 py-2 text-pit-grey">{n}</p>
      ))}
    </div>
  )
}
