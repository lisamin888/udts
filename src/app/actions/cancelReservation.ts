'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelReservation(reservationId: string, meetingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('user_id, meetings(meet_date)')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: '예약을 찾을 수 없습니다.' }
  if (reservation.user_id !== user.id) return { error: '권한이 없습니다.' }

  const meeting = Array.isArray(reservation.meetings) ? reservation.meetings[0] : reservation.meetings
  const meetDate = new Date((meeting as { meet_date: string }).meet_date)
  const hoursUntil = (meetDate.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < 48) {
    return { error: '모임 48시간 전 이후에는 취소할 수 없습니다.' }
  }

  await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', reservationId)
  await supabase.rpc('decrement_meeting_count', { meeting_id: meetingId })

  revalidatePath('/reservations')
  revalidatePath('/')
  return { success: true }
}
