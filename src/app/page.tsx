import { createClient } from '@/lib/supabase/server'
import ReserveButton from '@/components/ReserveButton'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 강사 여부 확인
  let isInstructor = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    isInstructor = profile?.role === 'instructor'
  }

  // 내가 신청한 모임 ID 목록
  let myReservations: string[] = []
  if (user) {
    const { data } = await supabase
      .from('reservations')
      .select('meeting_id')
      .eq('user_id', user.id)
    myReservations = (data ?? []).map((r: { meeting_id: string }) => r.meeting_id)
  }

  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
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
      ),
      reservations (
        users (
          id,
          name,
          level,
          role
        )
      )
    `)
    .order('meet_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">UDTS 다이빙</h1>
          <div className="flex gap-3 text-sm">
            {user ? (
              <div className="flex items-center gap-3">
                {isInstructor && (
                  <Link href="/meetings/new" className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                    + 모임 만들기
                  </Link>
                )}
                <Link href="/reservations" className="text-gray-600 hover:text-blue-600">예약 확인</Link>
                <form action="/auth/signout" method="POST">
                  <button className="text-gray-500 hover:text-gray-700">로그아웃</button>
                </form>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600">로그인</Link>
                <Link href="/signup" className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 모임 목록 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">예약 가능한 모임</h2>

        {!meetings || meetings.length === 0 ? (
          <p className="text-gray-400 text-center py-20">등록된 모임이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const center = Array.isArray(meeting.dive_centers)
                ? meeting.dive_centers[0]
                : meeting.dive_centers
              const instructor = Array.isArray(meeting.instructor)
                ? meeting.instructor[0]
                : meeting.instructor
              const isFull = meeting.current_count >= meeting.max_participants
              const date = new Date(meeting.meet_date)

              // 예약자 중 수강생만 추출
              type ReservationUser = { id: string; name: string; level: string | null; role: string } | null
              type ReservationRow = { users: ReservationUser | ReservationUser[] }
              const students = (meeting.reservations as ReservationRow[] ?? [])
                .map((r) => Array.isArray(r.users) ? r.users[0] : r.users)
                .filter((u): u is NonNullable<ReservationUser> => !!u && u.role === 'student')

              return (
                <div key={meeting.id} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                  {/* 1. 다이빙 센터 */}
                  <div>
                    {center?.location && (
                      <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                        {center.location}
                      </span>
                    )}
                    <h3 className="text-base font-bold mt-1">
                      {center?.name ?? '센터 미정'}
                      {(center?.depth_m || center?.length_m) && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          {center?.depth_m ? `수심 ${center.depth_m}M` : ''}
                          {center?.depth_m && center?.length_m ? ' · ' : ''}
                          {center?.length_m ? `길이 ${center.length_m}M` : ''}
                        </span>
                      )}
                    </h3>
                    {meeting.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{meeting.description}</p>
                    )}
                  </div>

                  {/* 2. 날짜/시간 */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span>
                      {date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                      {' '}
                      {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* 3. 인원 + 참가자 목록 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>👥</span>
                      <span>{meeting.current_count} / {meeting.max_participants}명</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${(meeting.current_count / meeting.max_participants) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 참가자 목록 */}
                    <div className="pl-1 space-y-1">
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
                      {/* 수강생 */}
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center gap-1.5 text-sm">
                          <span className="text-gray-800">{student.name}</span>
                          {student.level && (
                            <span className="text-gray-400 text-xs">{student.level}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. 버튼 영역 */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ReserveButton
                        meetingId={meeting.id}
                        isFull={isFull}
                        isLoggedIn={!!user}
                        alreadyReserved={myReservations.includes(meeting.id)}
                      />
                    </div>
                    {user?.id === meeting.instructor_id && (
                      <Link
                        href={`/meetings/${meeting.id}/edit`}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                      >
                        수정
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
