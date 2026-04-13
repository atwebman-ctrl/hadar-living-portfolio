export interface SpineColor { color: string; text: string }

export const SPINE_PALETTE: SpineColor[] = [
  { color: '#1B3A6B', text: '#E8EDF5' }, { color: '#8B4A2D', text: '#F5EDE8' },
  { color: '#2E4A3B', text: '#E8F0EC' }, { color: '#5E7FA0', text: '#EBF0F5' },
  { color: '#7B5EA0', text: '#F0EBF5' }, { color: '#4A7A5E', text: '#E8F2ED' },
  { color: '#A07B3E', text: '#F5EEE0' }, { color: '#6B2D2D', text: '#F5E8E8' },
  { color: '#4A6B8A', text: '#E8EFF5' }, { color: '#8A8074', text: '#F5F3F0' },
]

export const SPINE_HEIGHTS = [160, 150, 155, 148, 158, 144, 152, 162, 156, 145]

/** Stable hash → palette index, for consistent per-key coloring. */
export function paletteIndexFor(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xffff
  return h % SPINE_PALETTE.length
}
