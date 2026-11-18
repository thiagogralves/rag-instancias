import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const root = path.resolve("d:/Downloads/Rag")
const assets = "C:/Users/Thi/.cursor/projects/d-Downloads-Rag/assets"
const outDir = path.join(root, "public/art")

async function punchBackground(src, dest) {
  const image = sharp(src).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height

  // sample corners to detect backdrop color
  const samples = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
    (Math.floor(h * 0.08) * w + Math.floor(w * 0.08)) * 4,
    (Math.floor(h * 0.08) * w + Math.floor(w * 0.92)) * 4,
  ]
  let sr = 0, sg = 0, sb = 0
  for (const i of samples) {
    sr += data[i]
    sg += data[i + 1]
    sb += data[i + 2]
  }
  sr /= samples.length
  sg /= samples.length
  sb /= samples.length

  const dist = (r, g, b) => {
    const dr = r - sr
    const dg = g - sg
    const db = b - sb
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const d = dist(r, g, b)
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const greenDominant = g > 95 && g > r * 1.25 && g > b * 1.25
    const nearBackdrop = d < 48 || (d < 72 && luma < 40)
    const nearBlack = luma < 22 && Math.max(r, g, b) - Math.min(r, g, b) < 18

    if (greenDominant || nearBackdrop || nearBlack) {
      // soft edge
      const soft = Math.min(1, Math.max(0, (d - 28) / 40))
      if (nearBlack || d < 36 || greenDominant) {
        data[i + 3] = 0
      } else {
        data[i + 3] = Math.round(255 * soft)
      }
      continue
    }

    // despill
    if (g > r + 20 && g > b + 20) {
      data[i + 1] = Math.min(g, Math.max(r, b) + 10)
    }
  }

  // crop empty margins a bit after keying
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 8 })
    .png()
    .toBuffer()

  await sharp(png).png().toFile(dest)
  console.log("wrote", dest)
}

await mkdir(outDir, { recursive: true })
await punchBackground(path.join(assets, "char-magus-green.jpg"), path.join(outDir, "char-magus.png"))
await punchBackground(path.join(assets, "char-cardinal-green.jpg"), path.join(outDir, "char-cardinal.png"))
