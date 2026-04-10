import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ColorPicker from '@/components/ColorPicker'
import ProfileEditor from '@/components/ProfileEditor'
import ReservationTabs from '@/components/ReservationTabs'

export default async function ReservationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, role, level, dive_type, phone, attend_count, profile_color')
    .eq('id', user.id)
    .single()

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id,
      status,
      created_at,
      meetings (
        id,
        meet_date,
        end_date,
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
          nickname,
          level
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const profileColor = profile?.profile_color || '#3B82F6'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
          <h1 className="text-lg font-bold">마이페이지</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: profileColor }}
            >
              {profile?.nickname?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 truncate">{profile?.nickname ?? '닉네임 없음'}</div>
              <div className="text-sm text-gray-500">
                {profile?.role === 'instructor' ? '강사' : '수강생'}
                {profile?.level ? ` · ${profile.level}` : ''}
              </div>
              <ProfileEditor profile={{
                name: profile?.nickname ?? '',
                phone: profile?.phone ?? '',
                level: profile?.level ?? null,
                dive_type: profile?.dive_type ?? 'scuba',
              }} />
            </div>
            <div className="text-center shrink-0">
              <div className="text-2xl font-bold text-blue-600">{profile?.attend_count ?? 0}</div>
              <div className="text-xs text-gray-400">총 참여 횟수</div>
            </div>
          </div>
          <ColorPicker current={profileColor} />
        </div>

        {/* 예약 히스토리 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">예약 히스토리</h2>
          <ReservationTabs reservations={reservations ?? []} />
        </div>
      </main>
    </div>
  )
}
