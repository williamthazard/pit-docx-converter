/*
 * Renders an Ionicons icon as inline SVG. Icons imported from 'ionicons/icons'
 * are `data:image/svg+xml;utf8,<svg …>` strings whose paths use
 * stroke="currentColor" and a viewBox — so inlining lets the glyph inherit the
 * current text color and size to 1em (set via a text-size class on the icon).
 *
 * We render the web component's SVG directly instead of using <ion-icon>, whose
 * Stencil renderer fails to mount under this Vite + React 19 setup.
 */
interface IconProps {
  /** An import from 'ionicons/icons', e.g. cloudUploadOutline. */
  icon: string
  className?: string
  /** Accessible label. Omit for decorative icons (hidden from a11y tree). */
  label?: string
}

const DATA_URI_PREFIX = 'data:image/svg+xml;utf8,'

export function Icon({ icon, className, label }: IconProps) {
  const markup = icon.startsWith(DATA_URI_PREFIX) ? icon.slice(DATA_URI_PREFIX.length) : icon
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
