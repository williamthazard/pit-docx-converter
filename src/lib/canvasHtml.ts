/*
 * Turn a clean HTML fragment into Canvas-ready HTML: apply INLINE styles (the
 * only styling Canvas's RCE preserves on paste — it strips <style> blocks and
 * unknown classes) and pretty-print it for a readable source.
 *
 * Every property used here is on Canvas's CSS allowlist (color, background,
 * font-*, text-align, text-decoration, line-height, border*, padding*, margin*,
 * width, vertical-align), and `style` is allowed on all elements.
 */

// Inline style per element, tuned to match the in-app preview but using
// web-safe values (e.g. Georgia — Arvo isn't available inside Canvas).
const STYLE: Record<string, string> = {
  h1: "font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #15294a; line-height: 1.25; margin: 20px 0 8px;",
  h2: "font-family: Georgia, 'Times New Roman', serif; font-size: 21px; font-weight: 700; color: #3161ac; line-height: 1.3; margin: 18px 0 8px; border-bottom: 1px solid #d7dbe3; padding-bottom: 4px;",
  h3: "font-size: 18px; font-weight: 700; color: #15294a; margin: 16px 0 6px;",
  h4: "font-size: 16px; font-weight: 700; color: #15294a; margin: 14px 0 6px;",
  p: "margin: 10px 0; line-height: 1.5;",
  ul: "margin: 10px 0; padding-left: 24px; list-style: disc;",
  ol: "margin: 10px 0; padding-left: 24px; list-style: decimal;",
  li: "margin: 4px 0; line-height: 1.5;",
  a: "color: #3161ac; text-decoration: underline;",
  table: "border-collapse: collapse; width: 100%; margin: 14px 0; border: 1px solid #d7dbe3;",
  td: "border: 1px solid #d7dbe3; padding: 6px 10px; text-align: left; vertical-align: top;",
  th: "border: 1px solid #d7dbe3; padding: 6px 10px; text-align: left; vertical-align: top; background: #eef2fb; font-weight: 700;",
  blockquote: "margin: 12px 0; padding: 8px 14px; border-left: 3px solid #d7dbe3; color: #555555;",
  caption: "font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-weight: 700; color: #15294a; text-align: center; padding: 8px 0 0 0; caption-side: bottom;",
}

// Header styling reused for a table's first row (Word tables come through as
// <td> cells with no <th>, so we promote the first row visually).
const HEADER_CELL = STYLE.th

function applyInlineStyles(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(Object.keys(STYLE).join(',')).forEach((el) => {
    el.setAttribute('style', STYLE[el.tagName.toLowerCase()])
  })
  // Word wraps cell text in <p>; kill that paragraph's margin inside cells.
  root.querySelectorAll<HTMLElement>('td > p, th > p').forEach((p) => {
    p.setAttribute('style', 'margin: 0; line-height: 1.5;')
  })
  // Promote each table's first row to a header look + clean borders.
  root.querySelectorAll('table').forEach((table) => {
    table.setAttribute('cellspacing', '0')
    table.querySelector('tr')?.querySelectorAll('td, th').forEach((cell) => {
      cell.setAttribute('style', HEADER_CELL)
    })
  })
}

const BLOCK = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
  'blockquote', 'figure', 'figcaption',
])

function openTag(el: Element): string {
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${a.value.replace(/"/g, '&quot;')}"`)
    .join('')
  return `<${el.tagName.toLowerCase()}${attrs}>`
}

function hasBlockChild(el: Element): boolean {
  return Array.from(el.children).some((c) => BLOCK.has(c.tagName.toLowerCase()))
}

// Serialize one element: blocks with block children nest (indented, multi-line);
// everything else keeps its inline content on a single line.
function serialize(el: Element, depth: number, lines: string[]): void {
  const pad = '  '.repeat(depth)
  const tag = el.tagName.toLowerCase()
  if (tag === 'hr') {
    lines.push(`${pad}${openTag(el)}`)
    return
  }
  if (hasBlockChild(el)) {
    lines.push(`${pad}${openTag(el)}`)
    Array.from(el.children).forEach((child) => serialize(child, depth + 1, lines))
    lines.push(`${pad}</${tag}>`)
  } else {
    lines.push(`${pad}${openTag(el)}${el.innerHTML.trim()}</${tag}>`)
  }
}

/** Inline-style + pretty-print a clean fragment into Canvas-ready HTML. */
export function toCanvasHtml(fragment: string): string {
  const body = new DOMParser().parseFromString(fragment, 'text/html').body
  applyInlineStyles(body)
  // Blank line between top-level blocks for readable separation of sections.
  return Array.from(body.children)
    .map((el) => {
      const lines: string[] = []
      serialize(el, 0, lines)
      return lines.join('\n')
    })
    .join('\n\n')
}
