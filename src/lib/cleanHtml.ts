import DOMPurify from 'dompurify'

export interface CleanResult {
  html: string
  removedImages: number
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Post-process a converted HTML fragment. First sanitize with DOMPurify
 * (drops <script>, inline event handlers, javascript: URLs, etc.) — this is
 * the security chokepoint for everything shown in preview and pasted into
 * Canvas. Then remove images (counting them), drop empty paragraphs, and
 * strip style/id attributes. Returns a tidy fragment with no document wrapper.
 */
export function cleanHtml(input: string): CleanResult {
  const safe = DOMPurify.sanitize(input, { USE_PROFILES: { html: true } })
  const doc = new DOMParser().parseFromString(safe, 'text/html')
  const body = doc.body

  const images = body.querySelectorAll('img')
  const removedImages = images.length
  images.forEach((img) => img.remove())

  body.querySelectorAll('p').forEach((p) => {
    if (p.textContent?.trim() === '' && p.children.length === 0) p.remove()
  })

  body.querySelectorAll('[style], [id]').forEach((el) => {
    el.removeAttribute('style')
    el.removeAttribute('id')
  })

  return { html: body.innerHTML.trim(), removedImages }
}
