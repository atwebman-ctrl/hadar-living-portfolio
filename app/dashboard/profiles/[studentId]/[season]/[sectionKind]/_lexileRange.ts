// Pure helper for parsing the lexile_value column ('1150L-1300L' or '1185L')
// into a numeric { min, max } pair. Lives next to page.tsx since it's
// used only by the lexile branch.

export function parseLexileRange(value: string | null): { min: number; max: number } | null {
  if (!value) return null
  const m = value.match(/(\d+)L?\s*[-–]\s*(\d+)L?/)
  if (m) return { min: Number(m[1]), max: Number(m[2]) }
  const single = value.match(/(\d+)L?/)
  if (single) return { min: Number(single[1]), max: Number(single[1]) }
  return null
}
