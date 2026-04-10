'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const COLORS = [
  '#3B82F6', // 블루
  '#22C55E', // 그린
  '#A855F7', // 퍼플
  '#F97316', // 오렌지
  '#EF4444', // 레드
  '#EC4899', // 핑크
  '#06B6D4', // 시안
  '#EAB308', // 옐로우
  '#6366F1', // 인디고
  '#6B7280', // 그레이
]

export default function ColorPicker({ current }: { current: string }) {
  const [selected, setSelected] = useState(current || COLORS[0])
  const [saved, setSaved] = useState(false)

  async function handleSelect(color: string) {
    setSelected(color)
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ profile_color: color }).eq('id', user.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">프로필 색상</span>
        {saved && <span className="text-xs text-green-500">저장됨 ✓</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handleSelect(c)}
            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
              selected === c
                ? 'ring-2 ring-offset-2 ring-gray-600 scale-110'
                : 'ring-1 ring-gray-200'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}
