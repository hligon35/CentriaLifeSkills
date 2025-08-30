import 'server-only'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret')

export type JWTPayload = {
  sub: string
  role: 'THERAPIST' | 'PARENT' | 'ADMIN'
  name?: string
}

export async function signJwt(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JWTPayload
}

export function hasRole(user: JWTPayload | null, roles: Array<JWTPayload['role']>) {
  return !!user && roles.includes(user.role)
}
