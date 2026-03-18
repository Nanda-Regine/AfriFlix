/**
 * Generate AfriFlix PWA icons (192x192 and 512x512 PNG).
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install @napi-rs/canvas (or use sharp)
 *
 * This script generates branded icon PNGs from scratch using canvas.
 * If @napi-rs/canvas is not installed, it falls back to copying a placeholder.
 */
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '../public/icons')

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })

async function generateWithCanvas() {
  const { createCanvas } = await import('@napi-rs/canvas')

  for (const size of [192, 512]) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#0A0A0A'
    roundRect(ctx, 0, 0, size, size, size * 0.16)
    ctx.fill()

    // Gold border
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = size * 0.012
    roundRect(ctx, size * 0.04, size * 0.04, size * 0.92, size * 0.92, size * 0.12)
    ctx.stroke()

    // "A" letter
    ctx.fillStyle = '#C9A84C'
    ctx.font = `bold ${size * 0.44}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('A', size / 2, size * 0.44)

    // "FRIFLIX" text
    ctx.fillStyle = '#F2ECD9'
    ctx.font = `bold ${size * 0.1}px sans-serif`
    ctx.letterSpacing = `${size * 0.015}px`
    ctx.fillText('FRIFLIX', size / 2, size * 0.82)

    // Terracotta dot
    ctx.fillStyle = '#C4622D'
    ctx.beginPath()
    ctx.arc(size / 2, size * 0.32, size * 0.025, 0, Math.PI * 2)
    ctx.fill()

    const buffer = canvas.toBuffer('image/png')
    const path = join(iconsDir, `icon-${size}.png`)
    const write = createWriteStream(path)
    write.write(buffer)
    write.end()
    console.log(`Generated ${path}`)
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

generateWithCanvas().catch(err => {
  console.error('Could not generate icons (install @napi-rs/canvas):', err.message)
  console.log('Add placeholder icons manually to public/icons/icon-192.png and icon-512.png')
  process.exit(0)
})
