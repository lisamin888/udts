'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reserveMeeting } from '@/app/actions/reserve'

export default function ReserveButton({
  meetingId,
  isFull,
  isLoggedIn,
  alreadyReserved,
}: {
  meetingId: string
  isFull: boolean
  isLoggedIn: boolean
  alreadyReserved: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyReserved)
  const [error, setError] = useState('')
  const [showAlert, setShowAlert] = useState(false)

  async function handleClick() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError('')
    const result = await reserveMeeting(meetingId)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setDone(true)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }
  }

  if (isFull && !done) {
    return (
      <button disabled className="w-full py-2 rounded-lg bg-gray-200 text-gray-500 text-sm font-medium">
        마감
      </button>
    )
  }

  if (done) {
    return (
      <div className="space-y-1">
        <button disabled className="w-full py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
          신청완료
        </button>
        {showAlert && (
          <p className="text-green-600 text-xs text-center">신청이 완료됐습니다</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '처리 중...' : '신청하기'}
      </button>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  )
}
