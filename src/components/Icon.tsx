/*
 * Renders an Ionicons icon as inline SVG. Icons imported from 'ionicons/icons'
 * are `data:image/svg+xml;utf8,<svg …>` strings; we strip the data-URI prefix
 * and inline the markup. The paint is forced in CSS (.pit-icon svg *) to
 * fill:none / stroke:currentColor, so every glyph renders as a proper outline
 * in the current text color regardless of how the SVG's own attributes parse.
 */
interface IconProps {
  /** An import from 'ionicons/icons', e.g. cloudUploadOutline. */
  icon: string
  className?: string
  /** Accessible label. Omit for decorative icons (hidden from a11y tree). */
  label?: string
}

const DATA_URI_PREFIX = /^data:image\/svg\+xml(?:;[^,]*)?,/

export function Icon({ icon, className, label }: IconProps) {
  const markup = icon.replace(DATA_URI_PREFIX, '')
  return (
    <span
      className={`pit-icon ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Trusted, bundled Ionicons asset (not user input) — safe to inline.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
