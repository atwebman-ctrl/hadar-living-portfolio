// Pure helper extracted from page.tsx to keep that file under 300 lines.
// Fetches writing_samples for one language and shapes them into the
// CompositionSample contract (with imagePublicUrl pre-resolved).

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { storagePublicUrl } from '@/lib/storage'
import type { CompositionSample } from '@/components/profiles/sections/CompositionSection'

export async function loadCompositionSamples(
  studentId: string,
  schoolId:  string,
  language:  'english' | 'hebrew',
): Promise<CompositionSample[]> {
  const { data: rows } = await supabaseAdmin
    .from('writing_samples')
    .select('id, language, grade_level, academic_year, title, body, ocr_text, image_path')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('language', language)
    .is('deleted_at', null)
    .order('academic_year', { ascending: true })

  return (rows ?? []).map((r) => {
    const row = r as Record<string, unknown>
    return {
      id:             row.id as string,
      language,
      gradeLevel:     (row.grade_level as string) ?? '',
      academicYear:   (row.academic_year as string) ?? '',
      title:          (row.title as string) ?? null,
      body:           (row.body as string) ?? null,
      ocrText:        (row.ocr_text as string) ?? null,
      imagePublicUrl: storagePublicUrl((row.image_path as string) ?? null),
    }
  })
}
