import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReservationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id,
      status,
      created_at,
      meetings (
        id,
        meet_date,
        max_participants,
        current_count,
        description,
        instructor_id,
        dive_centers (
          name,
          location,
          depth_m,
          length_m
        ),
        instructor:users!instructor_id (
          name,
          level
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const statusLabel: Record<string, { text: string; className: string }> = {
    pending:   { text: '신청완료', className: 'bg-yellow-100 text-yellow-700' },
    confirmed: { text: '확정',     className: 'bg-green-100 text-green-700' },
    cancelled: { text: '취소',     className: 'bg-gray-100 text-gray-500' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
          <h1 className="text-lg font-bold">예약 확인</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {!reservations || reservations.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">신청한 모임이 없습니다.</p>
            <Link href="/" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
              모임 보러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => {
              const meeting = Array.isArray(res.meetings) ? res.meetings[0] : res.meetings
              if (!meeting) return null
              const center = Array.isArray(meeting.dive_centers) ? meeting.dive_centers[0] : meeting.dive_centers
              const instructor = Array.isArray(meeting.instructor) ? meeting.instructor[0] : meeting.instructor
              const date = new Date(meeting.meet_date)
              const status = statusLabel[res.status] ?? statusLabel.pending

              return (
                <div key={res.id} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                  {/* 센터 + 상태 */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold">
                        {center?.name ?? '센터 미정'}
                        {(center?.depth_m || center?.length_m) && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            {center?.depth_m ? `수심 ${center.depth_m}M` : ''}
                            {center?.depth_m && center?.length_m ? ' · ' : ''}
                            {center?.length_m ? `길이 ${center.length_m}M` : ''}
                          </span>
                        )}
                      </h3>
                      {center?.location && (
                        <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                          {center.location}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.className}`}>
                      {status.text}
                    </span>
                  </div>

                  {/* 설명 */}
                  {meeting.description && (
                    <p className="text-sm text-gray-500">{meeting.description}</p>
                  )}

                  {/* 날짜/시간 */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span>
                      {date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                      {' '}
                      {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* 인원 */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>👥</span>
                    <span>{meeting.current_count} / {meeting.max_participants}명</span>
                  </div>

                  {/* 강사 */}
                  {instructor && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-blue-600 font-bold">{instructor.name}</span>
                      {instructor.level && (
                        <span className="text-blue-400 text-xs">{instructor.level}</span>
                      )}
                      <span className="text-blue-300 text-xs">· 강사</span>
                    </div>
                  )}

                  {/* 신청일 */}
                  <p className="text-xs text-gray-400">
                    신청일: {new Date(res.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
