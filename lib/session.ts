import { cookies } from 'next/headers'
import { verifyJwt, JWTPayload } from './auth'

export async function getSession(): Promise<JWTPayload | null> {
  const token = cookies().get('token')?.value
  if (!token) return null
  try {
    return await verifyJwt(token)
  } catch (e) {
    return null
  }
}
