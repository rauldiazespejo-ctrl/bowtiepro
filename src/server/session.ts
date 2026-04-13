import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { Jwt } from 'hono/utils/jwt'

const COOKIE = 'bowtie_session'

export type SessionPayload = {
  sub: string
  email: string
  name: string
  role: 'super' | 'user'
  exp: number
}

function jwtSecret(): string {
  return process.env.JWT_SECRET ?? 'dev-only-change-JWT_SECRET-in-production'
}

export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14
  return Jwt.sign({ ...payload, exp }, jwtSecret(), 'HS256')
}

export async function readSession(c: Context): Promise<SessionPayload | null> {
  const token = getCookie(c, COOKIE)
  if (!token) return null
  try {
    const p = (await Jwt.verify(token, jwtSecret(), 'HS256')) as SessionPayload
    if (!p.sub || !p.email) return null
    return p
  } catch {
    return null
  }
}

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 14,
  })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE, { path: '/' })
}
