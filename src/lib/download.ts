import { buildCartridgeDocument } from './buildCartridgeDocument'
import type { AiCartridge } from '../types/cartridge'

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'cartridge'
}

function downloadText(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

export function downloadCartridgeHtml(cartridge: AiCartridge) {
  downloadText(`prompt-arcade-${slugify(cartridge.title)}.html`, buildCartridgeDocument(cartridge), 'text/html')
}
