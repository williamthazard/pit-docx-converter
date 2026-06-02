import { Icon } from './Icon'
import { warningOutline, informationCircleOutline } from '../icons'

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
          <Icon icon={warningOutline} className="mt-0.5 shrink-0 text-base text-pit-yellow-dark" />
          <span>{w}</span>
        </p>
      ))}
      {notes.map((n, i) => (
        <p
          key={`n${i}`}
          className="flex items-start gap-2 rounded-lg border border-pit-blue/15 bg-pit-blue/[0.06] px-3 py-2 text-pit-grey"
        >
          <Icon
            icon={informationCircleOutline}
            className="mt-0.5 shrink-0 text-base text-pit-blue dark:text-pit-blue-light"
          />
          <span>{n}</span>
        </p>
      ))}
    </div>
  )
}
