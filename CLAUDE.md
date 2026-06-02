# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A 100% client-side, PIT-branded React SPA. An instructor drops a Word **`.docx`**;
it is converted **entirely in the browser** to clean, Canvas-ready HTML they can
copy (as source or rich content) or download. No backend; no document is ever
uploaded anywhere — it ships as a static site, deployed to GitHub Pages
(`williamthazard.github.io/pit-docx-converter/`, auto-deploys on push to `main`).

**Scope is intentionally just `.docx`.** `.txt` (no formatting to preserve) and
`.pdf` (no real structure; lossy) were removed as not-worth-it. Every non-`.docx`
file is rejected with friendly, format-specific guidance to export a `.docx`.

The original spec/plan in `docs/superpowers/` are **historical** — the code is the
source of truth where they diverge (they predate the docx-only contraction and the
UI redesign). PIT assets (`PIT_logo_blue.png`, `favicon.png`) live in `public/`.

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build`.
- `npm test` — run the Vitest suite once. `npm run test:watch` for watch mode.
- Single file/test: `npx vitest run src/lib/cleanHtml.test.ts` / `npx vitest run -t "removes <img>"`
- `npm run lint` — ESLint.
- `npm run make-fixtures` — regenerate `src/lib/__fixtures__/sample.docx` (only if the docx test fixture needs changing).

## Architecture

**Conversion logic lives in `src/lib/` and is pure/isolated; `src/components/`
holds no conversion knowledge** — components call `convertFile` and render the
result. Respect this boundary.

```
convertFile(file)          // src/lib/convert.ts — dispatch by extension
  ├─ .docx → convertDocx()  // mammoth + style map + image strip → cleanHtml()
  └─ anything else → throw ConversionError(message, guidance)
```

- **`convertDocx`** (`src/lib/convertDocx.ts`) dynamically `import()`s mammoth
  (so it's code-split / import-safe under Node tests — don't hoist it). It maps
  Word styles with a heading offset (`Title`→`<h1>`, `Heading 1`→`<h2>`, …),
  strips images (counting them for the "N images removed" note), preserves
  tables/lists/hyperlinks, then routes through `cleanHtml`. mammoth needs
  different input per environment (`{ arrayBuffer }` in the browser, `{ buffer }`
  in Node tests) — handled with a `typeof Buffer` guard.
- **`cleanHtml`** (`src/lib/cleanHtml.ts`) is the single security chokepoint:
  it runs **DOMPurify** (drops `<script>`, inline handlers, `javascript:` URLs),
  then removes `<img>`, drops empty `<p>`, strips `style`/`id`. The app's only
  `dangerouslySetInnerHTML` (PreviewPane) renders exclusively this output.
  **Never bypass `cleanHtml` when producing display/export HTML.**
- **Output is a bare HTML fragment** (no `<html>`/`<body>` wrapper) for all three
  exports — Canvas supplies the surrounding page; download is a file copy of the
  same fragment.

## UI notes (gotchas worth knowing)

- **Icons: `<Icon icon={…} />`** (`src/components/Icon.tsx`) inlines an icon
  imported from `ionicons/icons`. The ionicons JS exports paint via CSS classes
  (`ionicon-fill-none`/`ionicon-stroke-width`) that only the `<ion-icon>` web
  component supplies — without it, glyphs render as **solid black silhouettes**.
  So `.pit-icon svg *` in `index.css` forces `fill:none; stroke:currentColor;
  stroke-width:32px` (all ionicons share a 512 viewBox). Don't reintroduce
  `<ion-icon>`; it failed to render under Vite + React 19.
- **Dropzone file input is an `opacity:0` full-size overlay** — clicking the zone
  is a direct click on the real input, so the dialog opens in every browser.
  Do NOT switch it back to a hidden input + programmatic `.click()` or a `<label>`;
  both were refused by some browsers. (Native OS dialogs also never appear in an
  automation-driven browser — verify uploads in a normal browser window.)
- **Dark mode** is class-based (`@custom-variant dark`): `ThemeMenu` toggles a
  `.dark` class on `<html>` (Light/Dark/System, persisted to `localStorage`,
  no-FOUC script in `index.html`). The palette is CSS variables overridden under
  `.dark`, so token-backed utilities (`bg-pit-card`, …) re-theme automatically;
  the blue header stays brand-blue in both modes (white logo via
  `filter: brightness(0) invert(1)`).

## Testing approach

Unit-test the pure logic directly — `cleanHtml` and the `convertFile` dispatch.
`convertDocx` gets one integration test against the committed `sample.docx`
fixture rather than mocking mammoth. Files needing `DOMParser`/DOMPurify or React
are annotated `// @vitest-environment jsdom`; other lib tests run in Node.

## Conventions

Mirrors the sibling `../react-test` PIT app: Vite + React 19 + TypeScript (strict),
**Tailwind v4** via `@tailwindcss/vite` with PIT tokens in an `@theme` block in
`src/index.css` (`--color-pit-blue: #3161AC`, `--color-pit-yellow: #F7CC07`,
`--color-pit-ink`, greys, `--color-pit-bg`/`--color-pit-card`/`--color-pit-line`;
Arvo headings / Open Sans body).

## Commits

Do **not** add `Co-Authored-By` trailers or any AI-authorship/"Generated with"
lines to commits or PRs.
