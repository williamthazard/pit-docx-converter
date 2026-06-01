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

  it('writes the html string to the clipboard on Copy HTML', async () => {
    render(<ExportBar html="<p>hi</p>" fileName="a.docx" />)
    fireEvent.click(screen.getByRole('button', { name: /copy html/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<p>hi</p>')
    // Await the success flash so the async setState settles inside act().
    expect(await screen.findByText(/copied html source/i)).toBeInTheDocument()
  })
})
