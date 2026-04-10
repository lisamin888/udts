'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNoShow(targetUserId: string, meetingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 해당 모임의 강사인지 확인
  const { data: meeting } = await supabase
    .from('meetings')
    .select('instructor_id')
    .eq('id', meetingId)
    .single()

  if (!meeting || meeting.instructor_id !== user.id) return { error: '권한이 없습니다.' }

  const { data: target } = await supabase
    .from('users')
    .select('no_show_count')
    .eq('id', targetUserId)
    .single()

  await supabase.from('users').update({
    no_show_count: ((target as { no_show_count?: number } | null)?.no_show_count ?? 0) + 1,
  }).eq('id', targetUserId)

  revalidatePath('/')
  return { success: true }
}
