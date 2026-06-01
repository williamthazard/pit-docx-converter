# PIT Docx → Canvas HTML — Design

**Date:** 2026-06-01
**Status:** Approved (pending spec review)

## Summary

A single-page, 100% client-side React SPA for PIT instructors. The instructor
drops a document onto the page; it is converted to clean, semantic,
Canvas-ready HTML entirely in the browser. The result renders in a live preview
and can be copied (as HTML source or as rich content) or downloaded. No backend,
no upload of course content — the app runs as a static site.

The reference experience is https://qti.uiw.edu/ : clean drag-and-drop, clear
flow, institutional branding.

## Goals

- Turn an instructor's existing course document into clean HTML they can paste
  into Canvas with minimal cleanup.
- Run entirely in the browser: no server, no document leaves the instructor's
  machine.
- Match PIT branding and the conventions of the existing `react-test` app.

## Non-Goals (v1)

- Quiz / assignment / rubric detection and Canvas-importable formats
  (this is the existing `py-canvas` toolchain's job).
- Image extraction / re-hosting (images are stripped — see below).
- Multi-file batch conversion.
- Direct upload to Canvas via its API.
- Accounts, persistence, or saved history.

## Supported Input Formats

All conversion happens client-side. Feasibility drove the format list:

| Format | Handling | Library | Fidelity |
|---|---|---|---|
| `.docx` | Full structural conversion | mammoth.js | High |
| `.txt` | Wrap text into paragraphs | native (`File.text()`) | N/A (plain text) |
| `.pdf` | **Text-only** extraction | pdfjs-dist | Lossy — no headings/tables/lists |
| `.doc` | Rejected with guidance | — | — |
| `.pages` | Rejected with guidance | — | — |

`.doc` (legacy binary Word) and `.pages` (proprietary Apple iWork) have no
reliable in-browser parser. They are rejected with a friendly message telling
the instructor to export/"Save As" `.docx` first (a one-click operation in Word
and Pages). `.pdf` is accepted but the UI clearly warns that structure (headings,
tables, lists) is lost and only text is recovered.

## Architecture

```
┌──────────── React SPA (static, all client-side) ────────────┐
│                                                              │
│  App.tsx                                                     │
│   ├─ <Dropzone>        accept files, dispatch by type        │
│   ├─ <ConversionNotes> show warnings/notes from convert      │
│   ├─ <ExportBar>       Copy HTML · Copy rich · Download       │
│   └─ <PreviewPane>     Preview / HTML-source tabs (post-conv) │
│                                                              │
│  lib/convert.ts        convertFile(file) → ConversionResult  │
│   ├─ convertDocx()     mammoth + style map + strip images    │
│   ├─ convertTxt()      escape + paragraph-wrap               │
│   ├─ convertPdf()      pdfjs-dist text extraction            │
│   └─ cleanHtml()       shared post-clean pass                │
└──────────────────────────────────────────────────────────────┘
```

The conversion logic is the heart of the app and lives in one isolated,
pure, well-tested module (`lib/convert.ts`). The UI only calls it and renders
the result — it holds no conversion knowledge of its own.

### `lib/convert.ts` contract

```ts
interface ConversionResult {
  html: string;       // clean HTML fragment (no <html>/<body> wrapper)
  notes: string[];    // human-readable, e.g. "3 images removed"
  warnings: string[]; // e.g. "PDF: structure not preserved, text only"
}

// Throws ConversionError on unreadable/unsupported input.
async function convertFile(file: File): Promise<ConversionResult>;
```

Dispatch is by file extension (with MIME as a secondary check). Unsupported
extensions (`.doc`, `.pages`, anything else) throw a `ConversionError` carrying
a user-facing message and, where relevant, export guidance.

### `.docx` conversion (mammoth)

1. Read the `.docx` ArrayBuffer with a **custom style map** mapping the styles
   these documents actually use (verified against a real PIT syllabus):
   - `Title` → `<h1>`
   - `Heading1` → `<h2>`, `Heading2` → `<h3>`, `Heading3` → `<h4>` (shifted down
     one level so the document Title is the single `<h1>`, and so headings sit
     below a Canvas page title in the rendered hierarchy)
   - `ListParagraph` / list numbering → `<ul>` / `<ol>`
   - tables → `<table>` (preserved — real docs rely on them heavily)
   - `Hyperlink` runs → `<a href>`
   The style map is structured so additional named styles (or a different
   heading offset) can be added later without touching the rest of the pipeline.
2. **Strip images:** mammoth's image handler returns nothing; we count dropped
   images and emit a note ("N images removed — re-add them in Canvas").
   (In practice the only image is often a header/footer logo, which mammoth
   ignores anyway.)
3. Pass the result through the shared `cleanHtml()` post-pass.

### `.txt` conversion

Read text, HTML-escape it, split on blank lines into `<p>` blocks, single
newlines become `<br>`. No external library.

### `.pdf` conversion

Use `pdfjs-dist` to extract text content per page in the browser. Join into
paragraphs heuristically (text only). Always emit a warning that structure is
not preserved. Note: PDF output quality is inherently limited; this is a
best-effort convenience, not a primary path.

### `cleanHtml()` shared post-pass

Operates on the HTML string / a parsed `DocumentFragment`:
- Remove empty paragraphs and collapse redundant whitespace.
- Drop stray `style=""` and `id` attributes mammoth may emit.
- Ensure output is a tidy fragment with no document wrapper.
- Normalize so the same string is used for both preview and copy/download
  (single source of truth).

## UI / Layout (Option C — two-pane, progressive)

**Initial state:** a single centered drop zone (clean, qti.uiw.edu-style),
PIT header above. No preview pane yet.

**After a successful conversion:** the layout becomes two panes —
- **Left (~35%):** filename + "replace file", the `<ExportBar>`, and
  `<ConversionNotes>` (e.g. "3 images removed", PDF structure warning).
- **Right (~65%):** `<PreviewPane>` with a **Preview / HTML source** tab toggle.
  *Preview* renders the HTML; *HTML source* shows the raw string in a `<pre>`.

The preview pane slides in only once there is a result to show.

**Responsive:** on narrow screens the panes stack — input/controls on top,
preview below.

**Empty / pre-conversion:** centered drop zone with copy like
"Drop a .docx, .txt, or .pdf to begin."

## Export Actions (`<ExportBar>`)

- **Copy HTML** (primary, PIT yellow) — copies the raw `html` string for Canvas's
  `</>` HTML view.
- **Copy rich** — writes `text/html` to the clipboard so it pastes formatted into
  Canvas's visual editor.
- **Download .html** — Blob download of the canonical fragment, named after the
  source file (`syllabus.docx` → `syllabus.html`). It's a file copy of the same
  HTML the copy buttons produce (a backup / hand-off), not a wrapped standalone
  document — there's no instructor use case for opening it as its own webpage.
  All three export actions emit the identical fragment, just to different
  destinations (clipboard text, clipboard rich, file).
- Each action shows a brief "Copied!" / "Downloaded" confirmation.
- All actions are disabled until a successful conversion exists.

## Error Handling

- **Unsupported type** (`.doc`, `.pages`, other): inline message in the drop
  zone with export-to-`.docx` guidance. No crash, app stays usable.
- **Reader throws** (corrupt/locked file): caught; friendly "Couldn't read that
  file" message; underlying error available in console for debugging.
- **Empty document:** preview area shows "Document appears to be empty."
- **PDF:** always surfaces the "text only, structure not preserved" warning.

## Tech Stack & Conventions

Mirrors the existing `react-test` PIT app:

- **Vite + React 19 + TypeScript.**
- **Tailwind v4** via `@tailwindcss/vite`, with PIT design tokens in an
  `@theme` block:
  `--color-pit-blue:#3161AC`, `--color-pit-blue-dark:#254d8a`,
  `--color-pit-yellow:#F7CC07`, greys, `--color-pit-bg:#f5f6fa`.
  Fonts: Arvo (headings) / Open Sans (body), matching `react-test`.
- **New dependencies:** `mammoth`, `pdfjs-dist`.
  (No Appwrite, no jszip — strip-images means no archive assembly.)
- **Structure:**
  - `src/App.tsx`
  - `src/components/Dropzone.tsx`, `PreviewPane.tsx`, `ExportBar.tsx`,
    `ConversionNotes.tsx`
  - `src/lib/convert.ts` (+ helpers)

## Testing

- **Unit tests for `lib/convert.ts`** (where the real logic lives) against
  fixture files:
  - a `.docx` with headings, lists, a table, a hyperlink, and an embedded image
    → assert clean HTML structure + image-removed note.
  - a `.txt` fixture → assert paragraph wrapping + escaping.
  - a `.pdf` fixture → assert text extraction + structure warning.
  - `.doc` / `.pages` → assert `ConversionError` with guidance.
- **Light component tests:** dropzone accept/reject by type; export buttons
  disabled until conversion succeeds; preview pane hidden pre-conversion.

## Open Questions / Future Work

- Optional later: a backend (LibreOffice headless) path for `.doc`/`.pages`,
  added behind the same `convertFile` contract without UI rework.
- Optional later: image extraction (download images + placeholders) if the
  strip-images default proves too aggressive for some instructors.
