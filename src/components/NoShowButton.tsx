'use client'

import { useState } from 'react'
import { markNoShow } from '@/app/actions/markNoShow'

export default function NoShowButton({ targetUserId, meetingId }: { targetUserId: string; meetingId: string }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('노쇼 처리하시겠습니까?')) return
    setLoading(true)
    await markNoShow(targetUserId, meetingId)
    setDone(true)
    setLoading(false)
  }

  if (done) return <span className="text-xs text-red-400">노쇼처리됨</span>

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded px-1.5 py-0.5 hover:bg-red-50 disabled:opacity-50"
    >
      노쇼
    </button>
  )
}
