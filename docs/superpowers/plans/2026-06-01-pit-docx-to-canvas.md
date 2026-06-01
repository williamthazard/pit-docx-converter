# PIT Docx → Canvas HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 100% client-side PIT-branded React SPA where an instructor drops a `.docx`/`.txt`/`.pdf` and gets clean, Canvas-ready HTML to copy or download.

**Architecture:** A single Vite + React + TypeScript SPA. All conversion happens in the browser in one isolated, pure module (`src/lib/`) that the UI merely calls. Heavy libraries (mammoth, pdf.js) are dynamically imported inside their converters so they code-split and keep the lib import-safe under Node tests. The UI is the two-pane "Option C" layout: a centered drop zone that, after a successful conversion, reveals a left controls column and a right preview pane.

**Tech Stack:** Vite 7, React 19, TypeScript 5.9 (strict), Tailwind CSS v4 (`@tailwindcss/vite`, `@theme`), mammoth.js (docx), pdfjs-dist (pdf), Vitest + @testing-library/react + jsdom (tests), docx (dev-only, to generate the test fixture).

---

## File Structure

```
pit-docx-converter/
├── index.html
├── package.json
├── vite.config.ts            # vite + react + tailwind + vitest `test` block
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── public/
│   └── favicon.png           # (optional; PIT logo can be added later)
├── scripts/
│   └── make-fixtures.mjs     # dev-only: generates src/lib/__fixtures__/sample.docx
└── src/
    ├── main.tsx
    ├── App.tsx               # state + two-pane progressive layout
    ├── index.css             # tailwind import + PIT @theme tokens
    ├── vitest.setup.ts       # @testing-library/jest-dom matchers
    ├── lib/
    │   ├── types.ts          # ConversionResult, ConversionError
    │   ├── cleanHtml.ts       # cleanHtml() + escapeHtml() (shared HTML utils)
    │   ├── convertTxt.ts
    │   ├── convertPdf.ts      # assemblePdfHtml() (pure) + convertPdf() (pdf.js)
    │   ├── convertDocx.ts     # mammoth + style map + image strip
    │   ├── convert.ts         # convertFile() dispatch by extension
    │   ├── __fixtures__/sample.docx
    │   ├── cleanHtml.test.ts
    │   ├── convertTxt.test.ts
    │   ├── convertPdf.test.ts
    │   ├── convertDocx.test.ts
    │   └── convert.test.ts
    └── components/
        ├── Dropzone.tsx
        ├── Dropzone.test.tsx
        ├── PreviewPane.tsx
        ├── ExportBar.tsx
        ├── ExportBar.test.tsx
        └── ConversionNotes.tsx
```

**Responsibilities:**
- `lib/types.ts` — shared types only; no logic. Imported everywhere so type names stay consistent.
- `lib/cleanHtml.ts` — the single post-processing pass: **sanitize (DOMPurify)** to remove scripts / event handlers / `javascript:` URLs, then strip images+count, drop empty `<p>`, strip `style`/`id`. Plus `escapeHtml`. Uses `DOMParser`. This is the one security chokepoint — all three converters route their output through it, so the HTML shown in the preview *and* handed to Canvas (and thence to students) is safe.
- `lib/convert{Txt,Pdf,Docx}.ts` — one input format each; each returns a `ConversionResult`.
- `lib/convert.ts` — extension dispatch + friendly errors. The only entry point the UI calls.
- `components/*` — dumb-ish presentational pieces; all conversion knowledge stays in `lib/`.

---

## Task 1: Scaffold the project (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vitest.setup.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "pit-docx-converter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "make-fixtures": "node scripts/make-fixtures.mjs"
  },
  "dependencies": {
    "dompurify": "^3.2.4",
    "mammoth": "^1.8.0",
    "pdfjs-dist": "^4.7.76",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/vite": "^4.2.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "docx": "^9.0.0",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.48.0",
    "vite": "^7.3.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PIT · Docx to Canvas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `vite.config.ts`** (includes the Vitest `test` block)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pit-docx-converter/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    setupFiles: ['./src/vitest.setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create the three tsconfig files**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client", "vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts", "scripts/**/*.mjs"]
}
```

- [ ] **Step 5: Create `eslint.config.js`**

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
```

- [ ] **Step 6: Create `src/index.css`** (Tailwind v4 + PIT tokens, mirroring `react-test`)

```css
@import url('https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&family=Open+Sans:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-heading: 'Arvo', 'Georgia', serif;
  --font-sans: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  --color-pit-blue: #3161AC;
  --color-pit-blue-dark: #254d8a;
  --color-pit-blue-light: #4a7fd4;
  --color-pit-yellow: #F7CC07;
  --color-pit-yellow-dark: #d4ad00;
  --color-pit-grey: #474747;
  --color-pit-grey-light: #6b6b6b;
  --color-pit-bg: #f5f6fa;
  --color-pit-card: #ffffff;
}

body {
  margin: 0;
  background: var(--color-pit-bg);
  color: var(--color-pit-grey);
  font-family: var(--font-sans);
}
```

- [ ] **Step 7: Create `src/vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 9: Create a placeholder `src/App.tsx`** (replaced in Task 11)

```tsx
function App() {
  return <h1 className="font-heading text-pit-blue p-8">PIT · Docx to Canvas</h1>
}

export default App
```

- [ ] **Step 10: Install dependencies**

Run: `cd ~/Desktop/other/pit-docx-converter && npm install`
Expected: completes with no error; `node_modules/` created.

- [ ] **Step 11: Verify the build and a smoke test run**

Run: `npm run build`
Expected: `tsc -b` passes and `vite build` writes `dist/` with no errors.

Run: `npx vitest run`
Expected: "No test files found" (acceptable at this point — exit code may be non-zero; that's fine, tests come next).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + React + TS + Tailwind + Vitest project"
```

---

## Task 2: `lib/types.ts` and `cleanHtml` / `escapeHtml`

**Files:**
- Create: `src/lib/types.ts`, `src/lib/cleanHtml.ts`, `src/lib/cleanHtml.test.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
export interface ConversionResult {
  /** Clean HTML fragment (no <html>/<body> wrapper). */
  html: string
  /** Human-readable notes, e.g. "3 images removed". */
  notes: string[]
  /** Caveats, e.g. PDF structure loss. */
  warnings: string[]
}

/** Thrown for unreadable or unsupported input. `guidance` is user-facing advice. */
export class ConversionError extends Error {
  guidance?: string
  constructor(message: string, guidance?: string) {
    super(message)
    this.name = 'ConversionError'
    this.guidance = guidance
  }
}
```

- [ ] **Step 2: Write the failing test** — `src/lib/cleanHtml.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { cleanHtml, escapeHtml } from './cleanHtml'

describe('escapeHtml', () => {
  it('escapes the HTML-significant characters', () => {
    expect(escapeHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d')
  })
})

describe('cleanHtml', () => {
  it('removes <img> elements and reports the count', () => {
    const out = cleanHtml('<p>Hi</p><img src="data:image/png;base64,AAAA"><img>')
    expect(out.html).not.toContain('<img')
    expect(out.removedImages).toBe(2)
  })

  it('drops empty paragraphs', () => {
    const out = cleanHtml('<p>keep</p><p></p><p>   </p>')
    expect(out.html).toBe('<p>keep</p>')
  })

  it('strips style and id attributes', () => {
    const out = cleanHtml('<p style="color:red" id="x">t</p>')
    expect(out.html).toBe('<p>t</p>')
  })

  it('returns empty string for empty input', () => {
    expect(cleanHtml('').html).toBe('')
    expect(cleanHtml('').removedImages).toBe(0)
  })

  it('removes <script> tags (sanitization)', () => {
    const out = cleanHtml('<p>ok</p><script>alert(1)</script>')
    expect(out.html).toBe('<p>ok</p>')
  })

  it('strips inline event-handler attributes (sanitization)', () => {
    const out = cleanHtml('<p onclick="alert(1)">t</p>')
    expect(out.html).toBe('<p>t</p>')
  })

  it('strips javascript: URLs on links (sanitization)', () => {
    const out = cleanHtml('<a href="javascript:alert(1)">x</a>')
    expect(out.html).not.toContain('javascript:')
  })
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run src/lib/cleanHtml.test.ts`
Expected: FAIL — `Failed to resolve import './cleanHtml'`.

- [ ] **Step 4: Implement `src/lib/cleanHtml.ts`**

```ts
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
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx vitest run src/lib/cleanHtml.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/cleanHtml.ts src/lib/cleanHtml.test.ts
git commit -m "Add shared types and cleanHtml (DOMPurify sanitize + tidy)"
```

---

## Task 3: `convertTxt`

**Files:**
- Create: `src/lib/convertTxt.ts`, `src/lib/convertTxt.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/convertTxt.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { convertTxt } from './convertTxt'

describe('convertTxt', () => {
  it('wraps blank-line-separated blocks in <p> and joins single newlines with <br>', () => {
    const r = convertTxt('Para one line one\nline two\n\nPara two')
    expect(r.html).toBe('<p>Para one line one<br>line two</p>\n<p>Para two</p>')
    expect(r.notes).toEqual([])
    expect(r.warnings).toEqual([])
  })

  it('escapes HTML-significant characters', () => {
    const r = convertTxt('a < b & c')
    expect(r.html).toBe('<p>a &lt; b &amp; c</p>')
  })

  it('returns empty html for empty/whitespace input', () => {
    expect(convertTxt('   \n  ').html).toBe('')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/convertTxt.test.ts`
Expected: FAIL — cannot resolve `./convertTxt`.

- [ ] **Step 3: Implement `src/lib/convertTxt.ts`**

```ts
import type { ConversionResult } from './types'
import { cleanHtml, escapeHtml } from './cleanHtml'

export function convertTxt(text: string): ConversionResult {
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${escapeHtml(b).replace(/\r?\n/g, '<br>')}</p>`)

  const html = cleanHtml(blocks.join('\n')).html
  return { html, notes: [], warnings: [] }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/convertTxt.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/convertTxt.ts src/lib/convertTxt.test.ts
git commit -m "Add plain-text converter"
```

---

## Task 4: `convertPdf` (pure assembly + pdf.js wiring)

**Files:**
- Create: `src/lib/convertPdf.ts`, `src/lib/convertPdf.test.ts`

The pure `assemblePdfHtml` function is unit-tested. The pdf.js-bound `convertPdf` is thin glue (not unit-tested — exercised manually in Task 11).

- [ ] **Step 1: Write the failing test** — `src/lib/convertPdf.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { assemblePdfHtml, PDF_WARNING } from './convertPdf'

describe('assemblePdfHtml', () => {
  it('wraps each page-text block into escaped paragraphs', () => {
    const html = assemblePdfHtml(['Page one text', 'Page two text'])
    expect(html).toBe('<p>Page one text</p>\n<p>Page two text</p>')
  })

  it('splits blank-line-separated blocks within a page and escapes', () => {
    const html = assemblePdfHtml(['Intro <x>\n\nSecond'])
    expect(html).toBe('<p>Intro &lt;x&gt;</p>\n<p>Second</p>')
  })

  it('ignores empty pages', () => {
    expect(assemblePdfHtml(['', '   '])).toBe('')
  })
})

describe('PDF_WARNING', () => {
  it('mentions that structure is not preserved', () => {
    expect(PDF_WARNING.toLowerCase()).toContain('text')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/convertPdf.test.ts`
Expected: FAIL — cannot resolve `./convertPdf`.

- [ ] **Step 3: Implement `src/lib/convertPdf.ts`**

```ts
import type { ConversionResult } from './types'
import { cleanHtml, escapeHtml } from './cleanHtml'

export const PDF_WARNING =
  'PDF: text extracted only — headings, tables, and lists are not preserved.'

/** Turn per-page extracted text into a clean paragraph fragment. */
export function assemblePdfHtml(pageTexts: string[]): string {
  const paragraphs = pageTexts
    .flatMap((t) => t.split(/\r?\n\s*\r?\n/))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${escapeHtml(s)}</p>`)

  return cleanHtml(paragraphs.join('\n')).html
}

/** Extract text from a PDF in the browser via pdf.js (dynamically imported). */
export async function convertPdf(data: ArrayBuffer): Promise<ConversionResult> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data }).promise
  const pageTexts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pageTexts.push(text)
  }

  return { html: assemblePdfHtml(pageTexts), notes: [], warnings: [PDF_WARNING] }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/convertPdf.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/convertPdf.ts src/lib/convertPdf.test.ts
git commit -m "Add PDF text converter (pure assembly + pdf.js wiring)"
```

---

## Task 5: Test fixture generator + `convertDocx`

**Files:**
- Create: `scripts/make-fixtures.mjs`, `src/lib/__fixtures__/sample.docx` (generated), `src/lib/convertDocx.ts`, `src/lib/convertDocx.test.ts`

- [ ] **Step 1: Create `scripts/make-fixtures.mjs`** (uses the `docx` dev dependency)

```js
// Generates a deterministic .docx fixture for convertDocx tests.
// Run: npm run make-fixtures
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun, ExternalHyperlink,
  Table, TableRow, TableCell, ImageRun, WidthType,
} from 'docx'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'src', 'lib', '__fixtures__')
mkdirSync(outDir, { recursive: true })

// 1x1 transparent PNG.
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const png = Buffer.from(pngBase64, 'base64')

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: 'Capstone Syllabus', heading: HeadingLevel.TITLE }),
      new Paragraph({ text: 'Course Overview', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [
        new TextRun('See the '),
        new ExternalHyperlink({
          children: [new TextRun({ text: 'PIT site', style: 'Hyperlink' })],
          link: 'https://qti.uiw.edu/',
        }),
        new TextRun(' for details.'),
      ] }),
      new Paragraph({ text: 'First bullet', bullet: { level: 0 } }),
      new Paragraph({ text: 'Second bullet', bullet: { level: 0 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            new TableCell({ children: [new Paragraph('Week')] }),
            new TableCell({ children: [new Paragraph('Topic')] }),
          ] }),
          new TableRow({ children: [
            new TableCell({ children: [new Paragraph('1')] }),
            new TableCell({ children: [new Paragraph('Intro')] }),
          ] }),
        ],
      }),
      new Paragraph({ children: [
        new ImageRun({ type: 'png', data: png, transformation: { width: 1, height: 1 } }),
      ] }),
    ],
  }],
})

const buffer = await Packer.toBuffer(doc)
writeFileSync(join(outDir, 'sample.docx'), buffer)
console.log('Wrote', join(outDir, 'sample.docx'))
```

- [ ] **Step 2: Generate the fixture**

Run: `npm run make-fixtures`
Expected: prints `Wrote .../src/lib/__fixtures__/sample.docx`; the file exists.

- [ ] **Step 3: Write the failing test** — `src/lib/convertDocx.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { convertDocx } from './convertDocx'

function fixtureArrayBuffer(): ArrayBuffer {
  const here = dirname(fileURLToPath(import.meta.url))
  const buf = readFileSync(join(here, '__fixtures__', 'sample.docx'))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

describe('convertDocx', () => {
  it('maps Title to <h1> and Heading 1 to <h2> (offset)', async () => {
    const r = await convertDocx(fixtureArrayBuffer())
    expect(r.html).toContain('<h1>Capstone Syllabus</h1>')
    expect(r.html).toContain('<h2>Course Overview</h2>')
  })

  it('preserves tables, lists, and hyperlinks', async () => {
    const r = await convertDocx(fixtureArrayBuffer())
    expect(r.html).toContain('<table>')
    expect(r.html).toContain('<li>First bullet</li>')
    expect(r.html).toContain('href="https://qti.uiw.edu/"')
  })

  it('strips images and reports the count in notes', async () => {
    const r = await convertDocx(fixtureArrayBuffer())
    expect(r.html).not.toContain('<img')
    expect(r.notes.some((n) => /image/i.test(n) && n.includes('1'))).toBe(true)
  })
})
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npx vitest run src/lib/convertDocx.test.ts`
Expected: FAIL — cannot resolve `./convertDocx`.

- [ ] **Step 5: Implement `src/lib/convertDocx.ts`**

```ts
import type { ConversionResult } from './types'
import { cleanHtml } from './cleanHtml'

const STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Heading 1'] => h2:fresh",
  "p[style-name='Heading 2'] => h3:fresh",
  "p[style-name='Heading 3'] => h4:fresh",
]

export async function convertDocx(data: ArrayBuffer): Promise<ConversionResult> {
  const mammoth = await import('mammoth')

  const result = await mammoth.convertToHtml(
    { arrayBuffer: data },
    {
      styleMap: STYLE_MAP,
      // Emit attribute-less <img> tags (no base64 bloat); cleanHtml strips them.
      convertImage: mammoth.images.imgElement(() => Promise.resolve({})),
    },
  )

  const cleaned = cleanHtml(result.value)
  const notes: string[] = []
  if (cleaned.removedImages > 0) {
    const n = cleaned.removedImages
    notes.push(`${n} image${n === 1 ? '' : 's'} removed — re-add ${n === 1 ? 'it' : 'them'} in Canvas.`)
  }

  return { html: cleaned.html, notes, warnings: [] }
}
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `npx vitest run src/lib/convertDocx.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit** (the fixture is committed too — it's deterministic and small)

```bash
git add scripts/make-fixtures.mjs src/lib/__fixtures__/sample.docx src/lib/convertDocx.ts src/lib/convertDocx.test.ts
git commit -m "Add docx converter with style map + image strip, and test fixture"
```

---

## Task 6: `convertFile` dispatch

**Files:**
- Create: `src/lib/convert.ts`, `src/lib/convert.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/convert.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { convertFile } from './convert'
import { ConversionError } from './types'

function file(name: string, content = 'hello'): File {
  return new File([content], name, { type: 'text/plain' })
}

describe('convertFile dispatch', () => {
  it('converts .txt content', async () => {
    const r = await convertFile(file('notes.txt', 'one\n\ntwo'))
    expect(r.html).toBe('<p>one</p>\n<p>two</p>')
  })

  it('rejects .doc with export guidance', async () => {
    await expect(convertFile(file('old.doc'))).rejects.toMatchObject({
      name: 'ConversionError',
    })
    try {
      await convertFile(file('old.doc'))
    } catch (e) {
      expect((e as ConversionError).guidance).toMatch(/\.docx/i)
    }
  })

  it('rejects .pages with export guidance', async () => {
    await expect(convertFile(file('paper.pages'))).rejects.toMatchObject({
      name: 'ConversionError',
    })
  })

  it('rejects an unknown extension', async () => {
    await expect(convertFile(file('image.png'))).rejects.toBeInstanceOf(ConversionError)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/convert.test.ts`
Expected: FAIL — cannot resolve `./convert`.

- [ ] **Step 3: Implement `src/lib/convert.ts`**

```ts
import type { ConversionResult } from './types'
import { ConversionError } from './types'
import { convertTxt } from './convertTxt'

export const ACCEPTED_EXTENSIONS = ['.docx', '.txt', '.pdf'] as const

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

export async function convertFile(file: File): Promise<ConversionResult> {
  switch (extensionOf(file.name)) {
    case '.docx': {
      const { convertDocx } = await import('./convertDocx')
      return convertDocx(await file.arrayBuffer())
    }
    case '.txt':
      return convertTxt(await file.text())
    case '.pdf': {
      const { convertPdf } = await import('./convertPdf')
      return convertPdf(await file.arrayBuffer())
    }
    case '.doc':
    case '.pages':
      throw new ConversionError(
        `Can't read ${extensionOf(file.name)} files in the browser.`,
        'Open the file in Word or Pages and use "Save As" / "Export" to create a .docx, then upload that.',
      )
    default:
      throw new ConversionError(
        'Unsupported file type.',
        'Upload a .docx, .txt, or .pdf file.',
      )
  }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/convert.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full lib suite**

Run: `npx vitest run src/lib`
Expected: PASS — all lib tests green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/convert.ts src/lib/convert.test.ts
git commit -m "Add convertFile dispatch with friendly errors for .doc/.pages"
```

---

## Task 7: `Dropzone` component

**Files:**
- Create: `src/components/Dropzone.tsx`, `src/components/Dropzone.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/Dropzone.test.tsx`

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dropzone } from './Dropzone'

function makeFile(name: string): File {
  return new File(['x'], name, { type: 'text/plain' })
}

describe('Dropzone', () => {
  it('calls onFile when a file is selected via the input', () => {
    const onFile = vi.fn()
    render(<Dropzone onFile={onFile} fileName={null} />)
    const input = screen.getByTestId('file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('a.docx')] } })
    expect(onFile).toHaveBeenCalledTimes(1)
    expect(onFile.mock.calls[0][0].name).toBe('a.docx')
  })

  it('shows the current file name when one is set', () => {
    render(<Dropzone onFile={vi.fn()} fileName="syllabus.docx" />)
    expect(screen.getByText(/syllabus\.docx/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/components/Dropzone.test.tsx`
Expected: FAIL — cannot resolve `./Dropzone`.

- [ ] **Step 3: Implement `src/components/Dropzone.tsx`**

```tsx
import { useRef, useState } from 'react'
import { ACCEPTED_EXTENSIONS } from '../lib/convert'

interface DropzoneProps {
  onFile: (file: File) => void
  fileName: string | null
}

export function Dropzone({ onFile, fileName }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onFile(files[0])
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        dragging ? 'border-pit-blue bg-pit-blue/5' : 'border-pit-blue/50 bg-pit-card'
      }`}
    >
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="font-heading text-lg text-pit-blue">
        {fileName ? `Loaded: ${fileName}` : 'Drop a .docx, .txt, or .pdf'}
      </p>
      <p className="mt-1 text-sm text-pit-grey-light">
        {fileName ? 'Click to replace' : 'or click to choose a file'}
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/components/Dropzone.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Dropzone.tsx src/components/Dropzone.test.tsx
git commit -m "Add Dropzone component"
```

---

## Task 8: `PreviewPane` component

**Files:**
- Create: `src/components/PreviewPane.tsx`

This is presentational; covered by the App-level manual check in Task 11. No unit test (rendering arbitrary HTML + tab toggle is trivial display logic).

- [ ] **Step 1: Implement `src/components/PreviewPane.tsx`**

```tsx
import { useState } from 'react'

interface PreviewPaneProps {
  html: string
}

type Tab = 'preview' | 'source'

export function PreviewPane({ html }: PreviewPaneProps) {
  const [tab, setTab] = useState<Tab>('preview')

  const isEmpty = html.trim() === ''

  return (
    <div className="flex h-full flex-col rounded-xl border border-black/10 bg-pit-card">
      <div className="flex gap-1 border-b border-black/10 p-2">
        {(['preview', 'source'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${
              tab === t ? 'bg-pit-blue text-white' : 'text-pit-grey hover:bg-black/5'
            }`}
          >
            {t === 'preview' ? 'Preview' : 'HTML source'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isEmpty ? (
          <p className="text-pit-grey-light">Document appears to be empty.</p>
        ) : tab === 'preview' ? (
          <div
            className="prose-preview"
            // Safe: this html came through cleanHtml(), which runs DOMPurify
            // (scripts/event-handlers/javascript: URLs removed) before display.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="whitespace-pre-wrap break-all text-sm text-pit-grey">{html}</pre>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PreviewPane.tsx
git commit -m "Add PreviewPane with Preview / HTML-source tabs"
```

---

## Task 9: `ExportBar` component

**Files:**
- Create: `src/components/ExportBar.tsx`, `src/components/ExportBar.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/ExportBar.test.tsx`

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportBar } from './ExportBar'

describe('ExportBar', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined), write: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('disables all actions when there is no html', () => {
    render(<ExportBar html="" fileName={null} />)
    expect(screen.getByRole('button', { name: /copy html/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /copy rich/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled()
  })

  it('writes the html string to the clipboard on Copy HTML', () => {
    render(<ExportBar html="<p>hi</p>" fileName="a.docx" />)
    fireEvent.click(screen.getByRole('button', { name: /copy html/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<p>hi</p>')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/components/ExportBar.test.tsx`
Expected: FAIL — cannot resolve `./ExportBar`.

- [ ] **Step 3: Implement `src/components/ExportBar.tsx`**

```tsx
import { useState } from 'react'

interface ExportBarProps {
  html: string
  fileName: string | null
}

function downloadName(fileName: string | null): string {
  if (!fileName) return 'converted.html'
  const dot = fileName.lastIndexOf('.')
  const stem = dot === -1 ? fileName : fileName.slice(0, dot)
  return `${stem}.html`
}

export function ExportBar({ html, fileName }: ExportBarProps) {
  const [flash, setFlash] = useState<string | null>(null)
  const disabled = html.trim() === ''

  function announce(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 1500)
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html)
    announce('Copied HTML source')
  }

  async function copyRich() {
    const item = new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })
    await navigator.clipboard.write([item])
    announce('Copied rich content')
  }

  function download() {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName(fileName)
    a.click()
    URL.revokeObjectURL(url)
    announce('Downloaded')
  }

  const base = 'rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col gap-2">
      <button onClick={copyHtml} disabled={disabled} className={`${base} bg-pit-yellow text-pit-grey hover:bg-pit-yellow-dark`}>
        Copy HTML
      </button>
      <button onClick={copyRich} disabled={disabled} className={`${base} bg-pit-blue text-white hover:bg-pit-blue-dark`}>
        Copy rich
      </button>
      <button onClick={download} disabled={disabled} className={`${base} border border-pit-blue text-pit-blue hover:bg-pit-blue/5`}>
        Download .html
      </button>
      <span className="h-4 text-xs text-pit-grey-light">{flash}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/components/ExportBar.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ExportBar.tsx src/components/ExportBar.test.tsx
git commit -m "Add ExportBar (copy HTML, copy rich, download) with disabled states"
```

---

## Task 10: `ConversionNotes` component

**Files:**
- Create: `src/components/ConversionNotes.tsx`

Presentational; verified in Task 11.

- [ ] **Step 1: Implement `src/components/ConversionNotes.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ConversionNotes.tsx
git commit -m "Add ConversionNotes component"
```

---

## Task 11: Wire up `App` (progressive two-pane layout) + manual verification

**Files:**
- Modify: `src/App.tsx` (replace the Task 1 placeholder)

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { useState } from 'react'
import { convertFile } from './lib/convert'
import type { ConversionResult } from './lib/types'
import { ConversionError } from './lib/types'
import { Dropzone } from './components/Dropzone'
import { PreviewPane } from './components/PreviewPane'
import { ExportBar } from './components/ExportBar'
import { ConversionNotes } from './components/ConversionNotes'

function App() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<{ message: string; guidance?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    setFileName(file.name)
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      setResult(await convertFile(file))
    } catch (e) {
      if (e instanceof ConversionError) {
        setError({ message: e.message, guidance: e.guidance })
      } else {
        setError({ message: "Couldn't read that file.", guidance: 'Try re-saving it, or use a different format.' })
        console.error(e)
      }
    } finally {
      setBusy(false)
    }
  }

  const hasResult = result !== null

  return (
    <div className="min-h-screen">
      <header className="bg-pit-blue px-6 py-4 text-white">
        <h1 className="font-heading text-xl">PIT · Docx to Canvas</h1>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className={hasResult ? 'grid gap-6 md:grid-cols-[minmax(0,35%)_minmax(0,1fr)]' : 'mx-auto max-w-xl'}>
          <div className="flex flex-col gap-4">
            <Dropzone onFile={handleFile} fileName={fileName} />

            {busy && <p className="text-sm text-pit-grey-light">Converting…</p>}

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                <p className="font-semibold">{error.message}</p>
                {error.guidance && <p className="mt-1">{error.guidance}</p>}
              </div>
            )}

            {hasResult && (
              <>
                <ExportBar html={result.html} fileName={fileName} />
                <ConversionNotes notes={result.notes} warnings={result.warnings} />
              </>
            )}
          </div>

          {hasResult && (
            <div className="min-h-[60vh]">
              <PreviewPane html={result.html} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Type-check, lint, and run the full test suite**

Run: `npx tsc -b && npm run test`
Expected: tsc passes; all Vitest tests green.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `dist/` written with no errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `npm run dev`
Then, using a browser (Playwright MCP or manual): open the dev URL, and:
1. Confirm the initial state shows only a centered drop zone (no preview pane).
2. Upload `src/lib/__fixtures__/sample.docx` (or the real `~/Downloads/PIT Syllabus Capstone 2.docx`).
3. Confirm the layout becomes two-pane: controls left, preview right.
4. Confirm the preview renders headings/table/list, the HTML-source tab shows clean markup (no `<img>`, no `style=`/`id=`), and the "image removed" note appears for the fixture.
5. Click **Copy HTML**, paste into a text editor, confirm it's the fragment.
6. Click **Download .html**, confirm the file saves as `sample.html`.
7. Try a `.doc`/`.pages` filename (rename any file) → confirm the friendly "Save As .docx" guidance shows and the app stays usable.

Expected: all of the above behave as described.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "Wire up App with progressive two-pane layout"
```

---

## Self-Review Notes (already applied)

- **Spec coverage:** scope (prose+structure) → Task 5 style map; all-frontend → dynamic imports, no server; formats `.docx/.txt/.pdf` + reject `.doc/.pages` → Tasks 3–6; strip images + count → Tasks 2 & 5; output preview + copy-html + copy-rich + download (bare fragment) → Tasks 8, 9; progressive two-pane layout → Task 11; PIT branding/conventions → Task 1; error handling → Tasks 6 & 11; testing → Tasks 2–9.
- **Security:** all converter output funnels through `cleanHtml`, which sanitizes with DOMPurify before the HTML is shown in preview, copied, or downloaded — closing the stored-XSS path into Canvas/students (Task 2). The single `dangerouslySetInnerHTML` use (PreviewPane) only ever receives this sanitized output.
- **Type consistency:** `ConversionResult { html, notes, warnings }` and `ConversionError(message, guidance)` defined once in `types.ts` and used unchanged throughout; `convertFile`, `convertDocx`, `convertTxt`, `convertPdf`, `assemblePdfHtml`, `cleanHtml`/`escapeHtml`, `ACCEPTED_EXTENSIONS` names are consistent across tasks and tests.
- **No placeholders:** every code/test step contains complete code and exact commands.
```
