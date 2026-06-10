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
    expect(r.html).toMatch(/<h1[^>]*>Capstone Syllabus<\/h1>/)
    expect(r.html).toMatch(/<h2[^>]*>Course Overview<\/h2>/)
  })

  it('preserves tables, lists, and hyperlinks', async () => {
    const r = await convertDocx(fixtureArrayBuffer())
    expect(r.html).toContain('<table')
    expect(r.html).toMatch(/<li[^>]*>First bullet<\/li>/)
    expect(r.html).toContain('href="https://qti.uiw.edu/"')
  })

  it('strips images and reports the count in notes', async () => {
    const r = await convertDocx(fixtureArrayBuffer())
    expect(r.html).not.toContain('<img')
    expect(r.notes.some((n) => /image/i.test(n) && n.includes('1'))).toBe(true)
  })

  it('inlines Canvas-ready styles and pretty-prints the output', async () => {
    const r = await convertDocx(fixtureArrayBuffer())
    // Inline styling carried onto elements (the only styling Canvas keeps).
    expect(r.html).toMatch(/<h2[^>]*style="[^"]*color: #3161ac/)
    expect(r.html).toMatch(/<table[^>]*style="[^"]*border-collapse: collapse/)
    // Pretty-printed: real newlines between blocks.
    expect(r.html).toContain('\n')
  })
})
