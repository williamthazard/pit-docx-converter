# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

The app is **not scaffolded yet**. The source of truth is:

- `docs/superpowers/specs/2026-06-01-pit-docx-to-canvas-design.md` — the design.
- `docs/superpowers/plans/2026-06-01-pit-docx-to-canvas.md` — the task-by-task implementation plan (TDD, with complete code for every step).

Build by following the plan in order. Do not improvise structure that contradicts the spec.

## What this is

A 100% client-side, PIT-branded React SPA. An instructor drops a `.docx`/`.txt`/`.pdf`; it is converted **entirely in the browser** to clean, Canvas-ready HTML they can copy (as source or rich content) or download. There is no backend and no document is ever uploaded anywhere — it ships as a static site.

## Commands

(Available once Task 1 of the plan is complete.)

- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build`.
- `npm test` — run the Vitest suite once.
- `npm run test:watch` — Vitest in watch mode.
- Single test file: `npx vitest run src/lib/cleanHtml.test.ts`
- Single test by name: `npx vitest run -t "removes <img>"`
- `npm run lint` — ESLint.
- `npm run make-fixtures` — regenerate the deterministic `src/lib/__fixtures__/sample.docx` used by the docx test (only needed if that fixture changes).

## Architecture

**All conversion logic lives in `src/lib/` and is pure/isolated; the React components in `src/components/` hold no conversion knowledge** — they call `convertFile` and render the result. Respect this boundary.

Conversion flow:

```
convertFile(file)            // src/lib/convert.ts — dispatch by file extension
  ├─ .docx → convertDocx()   // mammoth + style map + image strip
  ├─ .txt  → convertTxt()    // escape + paragraph-wrap
  ├─ .pdf  → convertPdf()    // pdf.js text extraction (lossy, text-only)
  └─ .doc/.pages → throw ConversionError(guidance: "save as .docx first")
        ↓ every converter routes its HTML through:
   cleanHtml()               // src/lib/cleanHtml.ts
```

`cleanHtml()` is two things at once and must stay the single chokepoint:

1. **The security boundary.** It runs DOMPurify, stripping `<script>`, inline event handlers, and `javascript:` URLs. Because the output is pasted into Canvas and shown to students, sanitization here is what prevents stored XSS from a crafted source document. The only `dangerouslySetInnerHTML` in the app (PreviewPane) renders exclusively this sanitized output. **Never bypass `cleanHtml` when producing display/export HTML.**
2. The cleanup pass: removes `<img>` (counting them for the "N images removed" note — images are intentionally dropped, not extracted), drops empty paragraphs, strips `style`/`id` attributes.

Key decisions baked into the design:

- **Heavy libraries are dynamically `import()`-ed inside their converter functions** (mammoth in `convertDocx`, pdf.js in `convertPdf`). This keeps `src/lib` import-safe under Node-based tests and lets Vite code-split them so they load only when that file type is actually converted. Preserve this — don't hoist them to top-level imports.
- **Output is a bare HTML fragment** (no `<html>`/`<body>` wrapper) for all three export actions — Canvas supplies the surrounding page. The download is a file copy of the same fragment, not a standalone document.
- **docx style map** offsets headings: Word `Title` → `<h1>`, `Heading 1` → `<h2>`, `Heading 2` → `<h3>` … so a document has one top-level heading that nests under the Canvas page title. Tables, lists, and hyperlinks are preserved.
- **`.doc` and `.pages` are deliberately unsupported** — there is no reliable in-browser parser; they are rejected with guidance to export to `.docx` first.

## Testing approach

Tests target the **pure string functions** (`cleanHtml`, `escapeHtml`, `convertTxt`, `assemblePdfHtml`, the `convertFile` dispatch) directly. The library-bound parts get one integration test each against a committed fixture rather than mocking the library. Tests that need `DOMParser`/`DOMPurify` or React are annotated `// @vitest-environment jsdom` at the top of the file; lib tests otherwise run in Node.

## Conventions

Mirrors the sibling `../react-test` PIT app: Vite + React 19 + TypeScript (strict), **Tailwind v4** via `@tailwindcss/vite` with PIT design tokens in an `@theme` block in `src/index.css` (`--color-pit-blue: #3161AC`, `--color-pit-yellow: #F7CC07`, greys, `--color-pit-bg: #f5f6fa`; Arvo headings / Open Sans body).

## Commits

Do **not** add `Co-Authored-By` trailers or any AI-authorship/"Generated with" lines to commits or PRs.
