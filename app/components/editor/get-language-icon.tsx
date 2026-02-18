'use client'

import { Languages } from '@/app/interfaces/languages'

export function getLanguageIcon(value: Languages) {
  switch (value) {
    case Languages.JAVASCRIPT:
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg"
          width={14}
          height={14}
          alt="JavaScript"
        />
      )
    case Languages.TYPESCRIPT:
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg"
          width={14}
          height={14}
          alt="TypeScript"
        />
      )
    case Languages.PYTHON:
      return (
        <img
          src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg"
          width={14}
          height={14}
          alt="Python"
        />
      )
    default:
      return null
  }
}
