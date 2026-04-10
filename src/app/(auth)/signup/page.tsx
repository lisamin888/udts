'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signupAction } from '@/app/actions/signup'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'student',
    instructorCode: '',
    dive_type: 'scuba',
    level: '',
  })
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!privacyAgreed) {
      setError('개인정보 수집 및 이용에 동의해주세요.')
      return
    }
    setLoading(true)
    setError('')

    const result = await signupAction(form)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">닉네임</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="6자 이상"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              전화번호
              <span className="ml-1 text-gray-400 font-normal">(알림 수신용, 선택)</span>
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">역할</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">수강생</option>
              <option value="instructor">강사</option>
            </select>
          </div>

          {form.role === 'instructor' && (
            <div>
              <label className="block text-sm font-medium mb-1">강사 코드</label>
              <input
                name="instructorCode"
                type="password"
                value={form.instructorCode}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="관리자에게 문의하세요"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">다이빙 종류</label>
            <select
              name="dive_type"
              value={form.dive_type}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scuba">스쿠버</option>
              <option value="free">프리다이빙</option>
              <option value="both">둘 다</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">레벨 <span className="text-gray-400">(선택)</span></label>
            <input
              name="level"
              value={form.level}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: OWD, AIDA2"
            />
          </div>

          <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-700">수집 항목:</span> 닉네임, 전화번호<br />
              <span className="font-medium text-gray-700">이용 목적:</span> 다이빙 예약 및 운영 안내<br />
              <span className="font-medium text-gray-700">보관 기간:</span> 탈퇴 시까지
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={e => setPrivacyAgreed(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm font-medium">
                <span className="text-blue-600">[필수]</span> 개인정보 수집 및 이용에 동의합니다
              </span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
