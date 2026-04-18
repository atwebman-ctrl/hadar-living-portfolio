// Pure helper extracted from page.tsx to keep that file under 300 lines.
// Fetches the most recent student_videos row tagged 'poetry_recitation'
// for a given student. Returns the video URL + title, or nulls.

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function loadLatestPoetryVideo(
  studentId: string,
  schoolId:  string,
): Promise<{ videoUrl: string | null; title: string | null }> {
  const { data: row } = await supabaseAdmin
    .from('student_videos')
    .select('video_url, title')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('category', 'poetry_recitation')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    videoUrl: (row?.video_url as string | null) ?? null,
    title:    (row?.title     as string | null) ?? null,
  }
}
