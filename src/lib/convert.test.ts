import { describe, it, expect } from 'vitest'
import { convertFile, ACCEPTED_EXTENSIONS } from './convert'
import { ConversionError } from './types'

function file(name: string, content = 'x'): File {
  return new File([content], name, { type: 'application/octet-stream' })
}

describe('convertFile dispatch', () => {
  it('accepts only .docx', () => {
    expect(ACCEPTED_EXTENSIONS).toEqual(['.docx'])
  })

  it('rejects .doc with guidance to save as .docx', async () => {
    await expect(convertFile(file('old.doc'))).rejects.toBeInstanceOf(ConversionError)
    try {
      await convertFile(file('old.doc'))
    } catch (e) {
      expect((e as ConversionError).guidance).toMatch(/\.docx/i)
    }
  })

  it('rejects .pages', async () => {
    await expect(convertFile(file('paper.pages'))).rejects.toBeInstanceOf(ConversionError)
  })

  it('rejects formats we no longer support (.txt, .pdf)', async () => {
    await expect(convertFile(file('a.txt'))).rejects.toBeInstanceOf(ConversionError)
    await expect(convertFile(file('a.pdf'))).rejects.toBeInstanceOf(ConversionError)
  })

  it('rejects an unknown extension', async () => {
    await expect(convertFile(file('image.png'))).rejects.toBeInstanceOf(ConversionError)
  })
})
