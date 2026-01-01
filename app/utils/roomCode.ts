// Utilities for strict room code handling: xxx-xxx-xxx (a–z)

// Generate a code like abc-def-ghi
export function generateRoomCode(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const pick3 = () => Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `${pick3()}-${pick3()}-${pick3()}`;
}

// Normalize arbitrary user input to strict format.
// - Removes non-letters
// - Uppercases
// - Requires exactly 9 letters; returns null if not possible
// - Formats as xXX-XXX-XXX
export function normalizeRoomCode(input: string): string | null {
  const onlyLetters = (input || '').toLowerCase().replace(/[^a-z]/g, '');
  if (onlyLetters.length !== 9) return null;
  return `${onlyLetters.slice(0, 3)}-${onlyLetters.slice(3, 6)}-${onlyLetters.slice(6, 9)}`;
}

// Validate already-formatted code
export function isValidRoomCode(code: string): boolean {
  return /^[a-z]{3}-[a-z]{3}-[a-z]{3}$/.test(code || '');
}
