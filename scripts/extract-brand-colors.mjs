import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import pLimit from 'p-limit'

/**
 * Truly dynamic brand color extraction.
 *
 * Strategy:
 * 1. Try stats().dominant — works for most logos
 * 2. If dominant is near-white/black/gray, sample raw pixels
 *    and find the most saturated color cluster
 * 3. Only fall back to default if logo is genuinely monochrome
 *
 * No hardcoded color tables. Every protocol gets its color
 * from its own logo.
 */

const DEFAULT_BRANDING = {
  primary: '#6366F1',
  accent: '#3730A3',
  text_on_primary: '#FFFFFF',
}

const FORCE = process.argv.includes('--force')
const CONCURRENCY = 5
const DELAY_MS = 120
const protocolsDir = path.join(process.cwd(), 'public', 'protocols')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function toHex(v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase() }
function rgbToHex(r, g, b) { return `#${toHex(r)}${toHex(g)}${toHex(b)}` }

function getTextOnPrimary(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#FFFFFF'
}

function darken(r, g, b, f = 0.6) {
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f)]
}

/** Check if a color is too close to white, black, or pure gray to be useful */
function isUsableColor(r, g, b) {
  // Too bright
  if (r >= 235 && g >= 235 && b >= 235) return false
  // Too dark
  if (r <= 20 && g <= 20 && b <= 20) return false
  // Grayscale (channels too similar)
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  if (spread < 25) return false
  return true
}

/** Calculate HSL saturation (0-1) for sorting pixels by "colorfulness" */
function saturation(r, g, b) {
  const rf = r / 255, gf = g / 255, bf = b / 255
  const max = Math.max(rf, gf, bf)
  const min = Math.min(rf, gf, bf)
  const l = (max + min) / 2
  if (max === min) return 0
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

function looksLikeImage(url = '') {
  return /\.(svg|png|jpg|jpeg|webp|gif)(\?|$)/i.test(url)
}

async function fetchRetry(url, n = 2) {
  let err
  for (let i = 0; i < n; i++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r
    } catch (e) { err = e; if (i < n - 1) await sleep(300) }
  }
  throw err
}

/**
 * Extract brand color from logo image.
 * 
 * Pass 1: Use sharp stats().dominant (fast, works for most)
 * Pass 2: If dominant is unusable, sample raw pixels and pick
 *          the most saturated color (handles white-bg logos)
 */
async function extractFromLogo(logoUrl) {
  if (!logoUrl) return null

  try {
    const res = await fetchRetry(logoUrl)
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (!ct.startsWith('image/') && !looksLikeImage(logoUrl)) return null

    const bytes = Buffer.from(await res.arrayBuffer())

    // Prepare image: flatten transparency onto dark bg
    const img = sharp(bytes)
      .resize(48, 48, { fit: 'cover' })
      .ensureAlpha()
      .flatten({ background: '#0A0A0A' })

    // Pass 1: Try dominant color
    try {
      const stats = await img.clone().stats()
      const d = stats.dominant
      if (d && isUsableColor(d.r, d.g, d.b)) {
        const [ar, ag, ab] = darken(d.r, d.g, d.b)
        return {
          primary: rgbToHex(d.r, d.g, d.b),
          accent: rgbToHex(ar, ag, ab),
          text_on_primary: getTextOnPrimary(d.r, d.g, d.b),
        }
      }
    } catch { /* continue to pass 2 */ }

    // Pass 2: Sample pixels, find most saturated color
    try {
      const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true })
      const pixels = []

      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        // Skip near-white, near-black, and low-saturation pixels
        if (!isUsableColor(r, g, b)) continue
        const sat = saturation(r, g, b)
        if (sat < 0.15) continue
        pixels.push({ r, g, b, sat })
      }

      if (pixels.length === 0) return null

      // Sort by saturation, take the top 20% most colorful pixels
      pixels.sort((a, b) => b.sat - a.sat)
      const topN = Math.max(1, Math.floor(pixels.length * 0.2))
      const top = pixels.slice(0, topN)

      // Average them for a stable representative color
      const avg = {
        r: Math.round(top.reduce((s, p) => s + p.r, 0) / top.length),
        g: Math.round(top.reduce((s, p) => s + p.g, 0) / top.length),
        b: Math.round(top.reduce((s, p) => s + p.b, 0) / top.length),
      }

      const [ar, ag, ab] = darken(avg.r, avg.g, avg.b)
      return {
        primary: rgbToHex(avg.r, avg.g, avg.b),
        accent: rgbToHex(ar, ag, ab),
        text_on_primary: getTextOnPrimary(avg.r, avg.g, avg.b),
      }
    } catch { return null }

  } catch { return null }
}

async function main() {
  const slugs = JSON.parse(
    await fs.readFile(path.join(protocolsDir, '_index.json'), 'utf8')
  ).protocols.map((e) => e.slug)

  console.log(`Processing ${slugs.length} protocols${FORCE ? ' (--force re-extract all)' : ' (skip existing)'}...\n`)

  const limit = pLimit(CONCURRENCY)
  let processed = 0, extracted = 0, kept = 0, defaulted = 0

  await Promise.all(slugs.map((slug) => limit(async () => {
    const fp = path.join(protocolsDir, `${slug}.json`)
    let raw
    try { raw = await fs.readFile(fp, 'utf8') } catch { processed++; return }
    const json = JSON.parse(raw)

    // Skip if already has branding (unless --force)
    if (json.branding && !FORCE) {
      processed++
      kept++
      return
    }

    // Extract from logo dynamically
    const branding = await extractFromLogo(json.logo_url)

    if (branding) {
      await fs.writeFile(fp, JSON.stringify({ ...json, branding }, null, 2) + '\n')
      processed++
      extracted++
      console.log(`[${processed}/${slugs.length}] ${slug} — ${branding.primary}`)
    } else {
      // Genuinely couldn't extract — use default
      await fs.writeFile(fp, JSON.stringify({ ...json, branding: DEFAULT_BRANDING }, null, 2) + '\n')
      processed++
      defaulted++
      console.log(`[${processed}/${slugs.length}] ${slug} — default (no usable color)`)
    }

    await sleep(DELAY_MS)
  })))

  console.log(`\nDone.`)
  console.log(`  Extracted: ${extracted}`)
  console.log(`  Kept:      ${kept}`)
  console.log(`  Default:   ${defaulted}`)
  console.log(`  Total:     ${slugs.length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
