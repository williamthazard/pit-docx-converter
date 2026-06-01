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

  it('is keyboard-focusable and opens the picker on Enter and Space', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone onFile={vi.fn()} fileName={null} />)
    const zone = screen.getByRole('button')
    expect(zone).toHaveAttribute('tabindex', '0')
    expect(zone).toHaveAccessibleName()
    fireEvent.keyDown(zone, { key: 'Enter' })
    fireEvent.keyDown(zone, { key: ' ' })
    expect(clickSpy).toHaveBeenCalledTimes(2)
    clickSpy.mockRestore()
  })
})
