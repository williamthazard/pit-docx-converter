interface ConversionNotesProps {
  notes: string[]
  warnings: string[]
}

export function ConversionNotes({ notes, warnings }: ConversionNotesProps) {
  if (notes.length === 0 && warnings.length === 0) return null
  return (
    <div className="flex flex-col gap-2 text-sm">
      {warnings.map((w, i) => (
        <p
          key={`w${i}`}
          className="flex items-start gap-2 rounded-lg border border-pit-yellow/40 bg-pit-yellow/10 px-3 py-2 text-pit-grey"
        >
          <ion-icon
            name="warning-outline"
            className="mt-0.5 shrink-0 text-base text-pit-yellow-dark"
            aria-hidden="true"
          />
          <span>{w}</span>
        </p>
      ))}
      {notes.map((n, i) => (
        <p
          key={`n${i}`}
          className="flex items-start gap-2 rounded-lg border border-pit-blue/15 bg-pit-blue/[0.06] px-3 py-2 text-pit-grey"
        >
          <ion-icon
            name="information-circle-outline"
            className="mt-0.5 shrink-0 text-base text-pit-blue"
            aria-hidden="true"
          />
          <span>{n}</span>
        </p>
      ))}
    </div>
  )
}
