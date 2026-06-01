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
