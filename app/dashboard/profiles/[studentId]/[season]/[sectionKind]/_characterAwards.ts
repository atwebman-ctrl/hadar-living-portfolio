// Pure helper extracted from page.tsx to keep that file under 300 lines.
// Fetches a student's character_awards and maps to the CharacterAward type.

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapCharacterAward } from '@/lib/mappers'
import type { CharacterAward } from '@/lib/types'

export async function loadCharacterAwards(
  studentId: string,
  schoolId:  string,
): Promise<CharacterAward[]> {
  const { data: rows } = await supabaseAdmin
    .from('character_awards')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('award_date', { ascending: false })

  return (rows ?? []).map((r) => mapCharacterAward(r as Record<string, unknown>))
}
