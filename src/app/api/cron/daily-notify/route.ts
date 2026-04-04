import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

export async function GET(request: Request) {
  // Vercel cron 보안 헤더 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // 내일 날짜 범위 계산
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)

  // 내일 모임 조회
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select(`
      id,
      meet_date,
      current_count,
      dive_centers ( name ),
      reservations (
        users ( name )
      )
    `)
    .gte('meet_date', tomorrow.toISOString())
    .lt('meet_date', dayAfter.toISOString())

  if (error) {
    console.error('DB 조회 오류:', error)
    return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 })
  }

  if (!meetings || meetings.length === 0) {
    return NextResponse.json({ message: '내일 모임 없음' })
  }

  const messageService = new SolapiMessageService(
    process.env.SOLAPI_API_KEY!,
    process.env.SOLAPI_API_SECRET!
  )

  const results = []

  for (const meeting of meetings) {
    const center = Array.isArray(meeting.dive_centers)
      ? meeting.dive_centers[0]
      : meeting.dive_centers

    const date = new Date(meeting.meet_date)
    const timeStr = date.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const names = (meeting.reservations ?? [])
      .map((r: { users: { name: string } | { name: string }[] | null }) => {
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        return u?.name ?? ''
      })
      .filter(Boolean)

    const text = [
      '[UDTS 내일 모임 안내]',
      `📍 ${center?.name ?? '센터 미정'}`,
      `🕙 ${timeStr}`,
      `👥 ${names.join(', ')} (총 ${names.length}명)`,
    ].join('\n')

    try {
      await messageService.sendOne({
        to: process.env.ADMIN_PHONE!,
        from: process.env.SOLAPI_SENDER!,
        text,
      })
      results.push({ meetingId: meeting.id, status: 'sent' })
    } catch (e) {
      console.error('문자 발송 오류:', e)
      results.push({ meetingId: meeting.id, status: 'failed', error: String(e) })
    }
  }

  return NextResponse.json({ results })
}
