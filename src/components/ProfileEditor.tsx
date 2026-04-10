'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  name: string
  phone: string
  level: string | null
  dive_type: string
}

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: profile.name ?? '',
    phone: profile.phone ?? '',
    level: profile.level ?? '',
    dive_type: profile.dive_type ?? 'scuba',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({
        nickname: form.name,
        phone: form.phone,
        level: form.level || null,
        dive_type: form.dive_type,
      }).eq('id', user.id)
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setOpen(false) }, 1000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-500 hover:underline"
      >
        프로필 수정
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">닉네임</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">전화번호 <span className="text-gray-400">(선택)</span></label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">레벨</label>
          <input
            name="level"
            value={form.level}
            onChange={handleChange}
            placeholder="OWD, AIDA2 등"
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">다이빙 종류</label>
          <select
            name="dive_type"
            value={form.dive_type}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="scuba">스쿠버</option>
            <option value="free">프리다이빙</option>
            <option value="both">둘 다</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saved ? '저장됨 ✓' : loading ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
        >
          취소
        </button>
      </div>
    </form>
  )
}
