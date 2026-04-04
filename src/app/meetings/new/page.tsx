'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DiveCenter = {
  id: string
  name: string
  location: string
  depth_m: number | null
  length_m: number | null
}

export default function NewMeetingPage() {
  const router = useRouter()
  const [centers, setCenters] = useState<DiveCenter[]>([])
  const [form, setForm] = useState({
    center_id: '',
    meet_date: '',
    meet_time: '09:00',
    max_participants: 8,
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // 강사 여부 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'instructor') { router.push('/'); return }

      // 센터 목록 로드
      const { data } = await supabase.from('dive_centers').select('id, name, location, depth_m, length_m')
      if (data) setCenters(data)
      if (data && data.length > 0) setForm(f => ({ ...f, center_id: data[0].id }))
    }
    load()
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요합니다.'); setLoading(false); return }

    const meet_date = new Date(`${form.meet_date}T${form.meet_time}:00`)

    const { error } = await supabase.from('meetings').insert({
      instructor_id: user.id,
      center_id: form.center_id,
      meet_date: meet_date.toISOString(),
      max_participants: Number(form.max_participants),
      description: form.description || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
          <h1 className="text-lg font-bold">모임 만들기</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1">다이빙 센터</label>
            <select
              name="center_id"
              value={form.center_id}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {centers.map(c => {
                const depth = c.depth_m ? `수심 ${c.depth_m}M` : ''
                const length = c.length_m ? `길이 ${c.length_m}M` : ''
                const specs = [depth, length].filter(Boolean).join(' · ')
                return (
                  <option key={c.id} value={c.id}>
                    {c.name}{specs ? ` (${specs})` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input
                type="date"
                name="meet_date"
                value={form.meet_date}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">시간</label>
              <input
                type="time"
                name="meet_time"
                value={form.meet_time}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">최대 인원</label>
            <input
              type="number"
              name="max_participants"
              value={form.max_participants}
              onChange={handleChange}
              min={1}
              max={50}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">설명 <span className="text-gray-400">(선택)</span></label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="강습 내용, 준비물 등"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '모임 만들기'}
          </button>
        </form>
      </main>
    </div>
  )
}
