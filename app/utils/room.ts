import { redirect } from 'next/navigation'
import { getRedis } from '@/app/lib/redis/client'

export function generateRoomCode(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const pick3 = () =>
    Array.from(
      { length: 3 },
      () => letters[Math.floor(Math.random() * letters.length)]
    ).join('')
  return `${pick3()}-${pick3()}-${pick3()}`
}

export function formatRoomCodeInput(input: string): string {
  const onlyLetters = (input || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 9)
  const a = onlyLetters.slice(0, 3)
  const b = onlyLetters.slice(3, 6)
  const c = onlyLetters.slice(6, 9)

  if (onlyLetters.length <= 3) return a
  if (onlyLetters.length <= 6) return `${a}-${b}`
  return `${a}-${b}-${c}`
}

export function normalizeRoomCode(input: string): string | null {
  const onlyLetters = (input || '').toLowerCase().replace(/[^a-z]/g, '')
  if (onlyLetters.length !== 9) return null
  return `${onlyLetters.slice(0, 3)}-${onlyLetters.slice(3, 6)}-${onlyLetters.slice(6, 9)}`
}

export function isValidRoomCode(code: string): boolean {
  return /^[a-z]{3}-[a-z]{3}-[a-z]{3}$/.test(code || '')
}

export function roomKey(id: string): string {
  return `room:${id}`
}

