'use server'

export async function verifyInstructorCode(code: string): Promise<boolean> {
  return code === process.env.INSTRUCTOR_CODE
}
