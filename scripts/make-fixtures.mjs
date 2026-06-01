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
