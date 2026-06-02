import DOMPurify from 'dompurify'

export interface CleanResult {
  html: string
  removedImages: number
}

/**
 * Post-process a converted HTML fragment. First sanitize with DOMPurify
 * (drops <script>, inline event handlers, javascript: URLs, etc.) — this is
 * the security chokepoint for everything shown in preview and pasted into
 * Canvas. Then remove images (counting them), drop empty paragraphs, and
 * strip style/id attributes. Returns a tidy fragment with no document wrapper.
 */
export function cleanHtml(input: string): CleanResult {
  // `<form>` survives this profile, but Canvas neutralizes forms on paste, so
  // it is benign in our threat model (instructor pastes their own doc into Canvas).
  const safe = DOMPurify.sanitize(input, { USE_PROFILES: { html: true } })
  const doc = new DOMParser().parseFromString(safe, 'text/html')
  const body = doc.body

  const images = body.querySelectorAll('img')
  const removedImages = images.length
  images.forEach((img) => img.remove())

  // Keep paragraphs that have element children (e.g. <p><br></p> from a blank
  // line, or <p><a>…</a></p>); only drop truly empty ones.
  body.querySelectorAll('p').forEach((p) => {
    if (p.textContent?.trim() === '' && p.children.length === 0) p.remove()
  })

  // Strip style/id only. `class` is intentionally preserved: our converters
  // don't currently emit classes, and stripping would fight a future
  // class-based mammoth style map.
  body.querySelectorAll('[style], [id]').forEach((el) => {
    el.removeAttribute('style')
    el.removeAttribute('id')
  })

  return { html: body.innerHTML.trim(), removedImages }
}
