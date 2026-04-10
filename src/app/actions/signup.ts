'use server'

import { createClient } from '@/lib/supabase/server'

type SignupData = {
  email: string
  password: string
  name: string
  phone: string
  role: string
  dive_type: string
  level: string
  instructorCode: string
}

export async function signupAction(data: SignupData): Promise<{ error?: string }> {
  // 강사 코드 검증
  if (data.role === 'instructor') {
    if (data.instructorCode !== process.env.INSTRUCTOR_CODE) {
      return { error: '강사 코드가 올바르지 않습니다.' }
    }
  }

  const supabase = await createClient()

  // 1. Auth 가입
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? ''
    return { error: msg.includes('already registered') ? '이미 사용 중인 이메일입니다.' : '회원가입에 실패했습니다.' }
  }

  // 2. users 테이블 저장
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    nickname: data.name,
    phone: data.phone || null,
    role: data.role,
    dive_type: data.dive_type,
    level: data.level || null,
    privacy_agreed_at: new Date().toISOString(),
  })

  if (profileError) {
    return { error: `프로필 저장 실패: ${profileError.message}` }
  }

  return {}
}
