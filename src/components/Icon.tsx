/*
 * Renders an Ionicons icon as a CSS mask painted with the current text color.
 *
 * Icons imported from 'ionicons/icons' are `data:image/svg+xml;utf8,<svg …>`
 * strings. We use the SVG as a mask and fill the element with
 * `background-color: currentColor`, so the glyph adopts the surrounding text
 * color (white on the blue header, navy on the yellow button, …) and sizes to
 * 1em. Masking avoids the fill/stroke pitfalls of inlining the SVG directly.
 */
interface IconProps {
  /** An import from 'ionicons/icons', e.g. cloudUploadOutline. */
  icon: string
  className?: string
  /** Accessible label. Omit for decorative icons (hidden from a11y tree). */
  label?: string
}

const DATA_URI_PREFIX = /^data:image\/svg\+xml(?:;[^,]*)?,/

function maskUrl(icon: string): string {
  const markup = icon.replace(DATA_URI_PREFIX, '')
  return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`
}

export function Icon({ icon, className, label }: IconProps) {
  const url = maskUrl(icon)
  return (
    <span
      className={`pit-icon ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  )
}
