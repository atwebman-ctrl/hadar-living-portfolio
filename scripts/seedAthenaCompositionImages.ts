// ============================================================
// scripts/seedAthenaCompositionImages.ts
//
// Generates 3 placeholder PNG thumbnails for Athena's existing
// writing_samples, uploads them to the portfolio-assets bucket,
// and backfills writing_samples.image_path. Stopgap until the
// Tier 2 composition upload workflow lands; without this the
// published profile shows no thumbnails at all.
// ============================================================

import { existsSync, readFileSync } from 'node:fs'
import sharp from 'sharp'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const SCHOOL_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const ATHENA    = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'
const BUCKET    = 'portfolio-assets'

const WIDTH  = 900
const HEIGHT = 1200

function buildSvg(label: string, subLabel: string): string {
  const ruleColor = '#D6D0C4'
  const ruleSpacing = 48
  const topMargin = 180
  const bottomMargin = 160
  const rules: string[] = []
  for (let y = topMargin; y <= HEIGHT - bottomMargin; y += ruleSpacing) {
    rules.push(`<line x1="80" y1="${y}" x2="${WIDTH - 80}" y2="${y}" stroke="${ruleColor}" stroke-width="1" opacity="0.55"/>`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#F7F4EE"/>
  <rect x="12" y="12" width="${WIDTH - 24}" height="${HEIGHT - 24}" fill="none" stroke="#1B3A6B" stroke-width="3" opacity="0.9"/>
  <rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" fill="#FEFDFB" stroke="#D6D0C4" stroke-width="1"/>
  <line x1="80" y1="110" x2="${WIDTH - 80}" y2="110" stroke="#C49A2A" stroke-width="2" opacity="0.65"/>
  <text x="${WIDTH / 2}" y="82" font-family="Georgia, serif" font-size="28" fill="#1C1917" text-anchor="middle" font-style="italic">${label}</text>
  ${rules.join('\n  ')}
  <text x="${WIDTH / 2}" y="${HEIGHT - 80}" font-family="Georgia, serif" font-size="14" fill="#A89878" text-anchor="middle" letter-spacing="3">${subLabel}</text>
</svg>`.trim()
}

type SamplePlan = {
  id:       string
  label:    string
  subLabel: string
}

const PLANS: SamplePlan[] = [
  { id: 'efd464c1-35a5-4b48-bd5e-c329d72fbccb', label: 'Composition · Grade 1',  subLabel: 'ACADEMIC YEAR 2023 — 2024' },
  { id: '24bf457f-ab28-4a67-9893-e9a5a18e0551', label: 'Composition · Grade 2',  subLabel: 'ACADEMIC YEAR 2024 — 2025' },
  { id: '9e38164f-2e83-4eaf-b368-3ca75d38d5f2', label: 'Composition · Grade 3',  subLabel: 'ACADEMIC YEAR 2025 — 2026' },
]

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  for (const plan of PLANS) {
    const svg = buildSvg(plan.label, plan.subLabel)
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
    const path = `${SCHOOL_ID}/writing-samples/${plan.id}.png`

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, png, { contentType: 'image/png', upsert: true })
    if (upErr) throw upErr

    const { error: dbErr } = await supabaseAdmin
      .from('writing_samples')
      .update({ image_path: path })
      .eq('id', plan.id)
      .eq('student_id', ATHENA)
      .eq('school_id', SCHOOL_ID)
    if (dbErr) throw dbErr

    const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    console.log(`✓ ${plan.id} — ${path}`)
    console.log(`  ${publicUrl}`)
  }

  console.log('\nDone. Verifying DB state:')
  const { data } = await supabaseAdmin
    .from('writing_samples')
    .select('id, title, image_path')
    .eq('student_id', ATHENA)
    .is('deleted_at', null)
  for (const r of data ?? []) console.log(`  ${r.id}  ${r.image_path}  — ${r.title}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
