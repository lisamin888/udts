'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reserveMeeting(meetingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 이미 신청했는지 확인
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('user_id', user.id)
    .eq('meeting_id', meetingId)
    .single()

  if (existing) return { error: '이미 신청한 모임입니다.' }

  // 정원 초과 확인
  const { data: meeting } = await supabase
    .from('meetings')
    .select('current_count, max_participants')
    .eq('id', meetingId)
    .single()

  if (!meeting) return { error: '모임을 찾을 수 없습니다.' }
  if (meeting.current_count >= meeting.max_participants) return { error: '정원이 초과됐습니다.' }

  // 신청 생성 (status: pending)
  const { error } = await supabase.from('reservations').insert({
    user_id: user.id,
    meeting_id: meetingId,
    status: 'pending',
  })

  if (error) return { error: '신청에 실패했습니다.' }

  // 인원 카운트 증가
  await supabase.rpc('increment_meeting_count', { meeting_id: meetingId })

  revalidatePath('/')
  return { success: true }
}
