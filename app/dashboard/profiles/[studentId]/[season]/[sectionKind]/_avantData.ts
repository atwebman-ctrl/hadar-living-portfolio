// Pure helper extracted from page.tsx to keep that file under 300 lines.
// Fetches AVANT assessments for a student and merges into per-term records.
// Shared by both the avant_hebrew and hebrew_comparison branches.

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mergeAvantAssessments } from '@/lib/avantHelpers'

export async function loadAvantAssessments(
  studentId:    string,
  schoolId:     string,
  gradeLevel:   string,
  academicYear: string,
) {
  const { data: rows } = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, term, academic_year, score')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .like('assessment_type', 'avant%')
    .is('deleted_at', null)

  const grade = parseInt(gradeLevel, 10)
  return mergeAvantAssessments(
    (rows ?? []) as Parameters<typeof mergeAvantAssessments>[0],
    Number.isNaN(grade) ? 0 : grade,
    academicYear,
  )
}
