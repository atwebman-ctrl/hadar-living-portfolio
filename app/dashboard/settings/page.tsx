// ============================================================
// app/dashboard/settings/page.tsx
//
// Server component. Admin-only school settings page.
// Teachers and parents are redirected back to the dashboard.
// ============================================================

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import SettingsUI from './SettingsUI'

export default async function SettingsPage() {
  let ctx: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch {
    redirect('/sign-in?redirect_url=/dashboard/settings')
  }

  if (ctx.role !== 'admin') redirect('/dashboard')

  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('id, name, logo_url')
    .eq('id', ctx.schoolId)
    .single()

  if (!school) redirect('/dashboard')

  return (
    <SettingsUI
      schoolId={school.id as string}
      schoolName={school.name as string}
      initialLogoUrl={(school.logo_url as string | null) ?? null}
    />
  )
}
