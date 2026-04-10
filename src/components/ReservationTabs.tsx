'use client'

import { useState } from 'react'
import { cancelReservation } from '@/app/actions/cancelReservation'

type DiveCenter = {
  name: string
  location: string | null
  depth_m: number | null
  length_m: number | null
}

type Instructor = {
  nickname: string
  level: string | null
}

type Meeting = {
  id: string
  meet_date: string
  end_date: string | null
  max_participants: number
  current_count: number
  description: string | null
  instructor_id: string
  dive_centers: DiveCenter | DiveCenter[] | null
  instructor: Instructor | Instructor[] | null
}

export type Reservation = {
  id: string
  status: string
  created_at: string
  meetings: Meeting | Meeting[] | null
}

type Tab = 'upcoming' | 'completed' | 'cancelled'

function classify(res: Reservation): Tab {
  if (res.status === 'cancelled') return 'cancelled'
  const meeting = Array.isArray(res.meetings) ? res.meetings[0] : res.meetings
  if (!meeting) return 'upcoming'
  const endDate = meeting.end_date ? new Date(meeting.end_date) : new Date(meeting.meet_date)
  return endDate < new Date() ? 'completed' : 'upcoming'
}

const statusLabel: Record<string, { text: string; className: string }> = {
  pending:   { text: '신청완료', className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: '확정',     className: 'bg-green-100 text-green-700' },
  cancelled: { text: '취소',     className: 'bg-gray-100 text-gray-500' },
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming',  label: '예정' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
]

function ReservationCard({ res, onCancel }: { res: Reservation; onCancel?: (id: string) => void }) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const meeting = Array.isArray(res.meetings) ? res.meetings[0] : res.meetings
  if (!meeting) return null
  const center = Array.isArray(meeting.dive_centers) ? meeting.dive_centers[0] : meeting.dive_centers
  const instructor = Array.isArray(meeting.instructor) ? meeting.instructor[0] : meeting.instructor
  const date = new Date(meeting.meet_date)
  const status = statusLabel[res.status] ?? statusLabel.pending
  const hoursUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60)
  const canCancel = hoursUntil >= 48

  async function handleCancel() {
    if (!confirm('예약을 취소하시겠습니까?')) return
    setCancelling(true)
    setCancelError('')
    const result = await cancelReservation(res.id, meeting!.id)
    if (result.error) {
      setCancelError(result.error)
      setCancelling(false)
    } else {
      onCancel?.(res.id)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
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

      {meeting.description && (
        <p className="text-sm text-gray-500">{meeting.description}</p>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>📅</span>
        <span>
          {date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          {' '}
          {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>👥</span>
        <span>{meeting.current_count} / {meeting.max_participants}명</span>
      </div>

      {instructor && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-blue-600 font-bold">{instructor.nickname}</span>
          {instructor.level && (
            <span className="text-blue-400 text-xs">{instructor.level}</span>
          )}
          <span className="text-blue-300 text-xs">· 강사</span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        신청일: {new Date(res.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* 취소 버튼 (예정 탭에서만, cancelled 아닌 경우) */}
      {res.status !== 'cancelled' && classify(res) === 'upcoming' && (
        <div className="pt-1">
          {canCancel ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? '취소 중...' : '예약 취소'}
            </button>
          ) : (
            <p className="text-xs text-center text-gray-400 py-1">
              모임 48시간 전 이후로 취소가 불가합니다
            </p>
          )}
          {cancelError && <p className="text-xs text-red-500 text-center mt-1">{cancelError}</p>}
        </div>
      )}
    </div>
  )
}

export default function ReservationTabs({ reservations }: { reservations: Reservation[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [cancelledIds, setCancelledIds] = useState<string[]>([])

  const active = reservations.filter(r => !cancelledIds.includes(r.id))

  const grouped = {
    upcoming:  active.filter(r => classify(r) === 'upcoming'),
    completed: active.filter(r => classify(r) === 'completed'),
    cancelled: active.filter(r => classify(r) === 'cancelled'),
  }

  const counts = {
    upcoming:  grouped.upcoming.length,
    completed: grouped.completed.length,
    cancelled: grouped.cancelled.length,
  }

  const current = grouped[activeTab]

  return (
    <div>
      <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>{activeTab === 'upcoming' ? '예정된 모임이 없습니다.' : activeTab === 'completed' ? '완료된 모임이 없습니다.' : '취소된 모임이 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {current.map(res => (
            <ReservationCard
              key={res.id}
              res={res}
              onCancel={(id) => setCancelledIds(prev => [...prev, id])}
            />
          ))}
        </div>
      )}
    </div>
  )
}
