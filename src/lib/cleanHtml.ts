import DOMPurify from 'dompurify'

export interface CleanResult {
  html: string
  removedImages: number
}

const BULLET_REGEX = /^\s*(?:[•\*\-\u2022\u2023\u2043\u204d\u2219\u25cb\u25cf\u25e6]|(?:[•\*\-]\s*){2,})\s*/
const NUMBER_REGEX = /^\s*(?:\d+|[a-zA-Z])[\.\)]\s+|\^\s*\(\d+\)\s+/

function fixHeadingHierarchy(body: HTMLElement): void {
  const h1s = Array.from(body.querySelectorAll('h1'))
  // Canvas LMS renders page title in an <h1>. Keep at most the first <h1>, demote subsequent <h1>s to <h2>
  for (let i = 1; i < h1s.length; i++) {
    const h2 = body.ownerDocument.createElement('h2')
    h2.innerHTML = h1s[i].innerHTML
    h1s[i].replaceWith(h2)
  }
}

function convertPseudoLists(body: HTMLElement): void {
  const paragraphs = Array.from(body.querySelectorAll('p'))
  let idx = 0

  while (idx < paragraphs.length) {
    const p = paragraphs[idx]
    if (!p.isConnected) {
      idx++
      continue
    }

    const text = p.textContent || ''
    let listType: 'ul' | 'ol' | null = null
    let regex: RegExp | null = null

    if (BULLET_REGEX.test(text)) {
      listType = 'ul'
      regex = BULLET_REGEX
    } else if (NUMBER_REGEX.test(text)) {
      listType = 'ol'
      regex = NUMBER_REGEX
    }

    if (listType && regex) {
      const group: HTMLParagraphElement[] = []
      let currIndex = idx

      while (currIndex < paragraphs.length) {
        const currP = paragraphs[currIndex]
        if (!currP.isConnected) break

        if (group.length > 0 && currP.previousElementSibling !== group[group.length - 1]) {
          break
        }

        const currText = currP.textContent || ''
        if (regex.test(currText)) {
          group.push(currP)
          currIndex++
        } else {
          break
        }
      }

      if (group.length > 0) {
        const listEl = body.ownerDocument.createElement(listType)
        group.forEach((pItem) => {
          const li = body.ownerDocument.createElement('li')
          let htmlStr = pItem.innerHTML.trim()
          htmlStr = htmlStr.replace(regex!, '')
          li.innerHTML = htmlStr
          listEl.appendChild(li)
        })

        group[0].replaceWith(listEl)
        for (let k = 1; k < group.length; k++) {
          group[k].remove()
        }
        idx = currIndex
        continue
      }
    }
    idx++
  }
}

function fixListNesting(body: HTMLElement): void {
  // Strip duplicate/manual bullet markers inside <li> text
  body.querySelectorAll('li').forEach((li) => {
    let htmlStr = li.innerHTML.trim()
    if (BULLET_REGEX.test(htmlStr)) {
      htmlStr = htmlStr.replace(BULLET_REGEX, '')
      li.innerHTML = htmlStr
    }
  })

  // Fix sublists placed directly inside ul/ol instead of inside li
  body.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol').forEach((childList) => {
    const prevLi = childList.previousElementSibling
    if (prevLi && prevLi.tagName.toLowerCase() === 'li') {
      prevLi.appendChild(childList)
    } else {
      const newLi = body.ownerDocument.createElement('li')
      childList.before(newLi)
      newLi.appendChild(childList)
    }
  })
}

function ensureTableCaptions(body: HTMLElement): void {
  body.querySelectorAll('table').forEach((table) => {
    if (table.querySelector('caption')) return

    let captionText = ''
    const prevEl = table.previousElementSibling

    if (prevEl && (prevEl.tagName.toLowerCase() === 'p' || /^h[1-6]$/i.test(prevEl.tagName))) {
      const text = prevEl.textContent?.trim() || ''
      if (text && text.length < 120) {
        captionText = text
        prevEl.remove()
      }
    }

    if (!captionText) {
      const firstCell = table.querySelector('th, td')
      const cellText = firstCell?.textContent?.trim()
      captionText = cellText ? `Table: ${cellText}` : 'Table Details'
    }

    const caption = body.ownerDocument.createElement('caption')
    caption.textContent = captionText
    table.prepend(caption)
  })
}

/**
 * Post-process a converted HTML fragment. First sanitize with DOMPurify
 * (drops <script>, inline event handlers, javascript: URLs, etc.) — this is
 * the security chokepoint for everything shown in preview and pasted into
 * Canvas. Then remove images (counting them), fix accessibility hierarchy,
 * convert pseudo-lists, fix list nesting, add table captions, drop empty
 * paragraphs, and strip style/id attributes. Returns a tidy fragment with no
 * document wrapper.
 */
export function cleanHtml(input: string): CleanResult {
  const safe = DOMPurify.sanitize(input, { USE_PROFILES: { html: true } })
  const doc = new DOMParser().parseFromString(safe, 'text/html')
  const body = doc.body

  const images = body.querySelectorAll('img')
  const removedImages = images.length
  images.forEach((img) => img.remove())

  // Accessibility & formatting improvements:
  fixHeadingHierarchy(body)
  convertPseudoLists(body)
  fixListNesting(body)
  ensureTableCaptions(body)

  // Keep paragraphs that have element children; only drop truly empty ones.
  body.querySelectorAll('p').forEach((p) => {
    if (p.textContent?.trim() === '' && p.children.length === 0) p.remove()
  })

  // Strip style/id only.
  body.querySelectorAll('[style], [id]').forEach((el) => {
    el.removeAttribute('style')
    el.removeAttribute('id')
  })

  return { html: body.innerHTML.trim(), removedImages }
}
