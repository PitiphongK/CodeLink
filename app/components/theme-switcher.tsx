'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@heroui/react'
import { useTheme } from 'next-themes'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const active = useMemo(() => {
    if (!mounted) return null
    // If user picked 'system', show the resolved value for highlighting.
    return theme === 'system' ? (resolvedTheme ?? 'system') : theme
  }, [mounted, resolvedTheme, theme])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">Theme</div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={theme === 'system' ? 'solid' : 'bordered'}
          color={theme === 'system' ? 'primary' : 'default'}
          onPress={() => setTheme('system')}
        >
          System
        </Button>
        <Button
          size="sm"
          variant={active === 'light' ? 'solid' : 'bordered'}
          color={active === 'light' ? 'primary' : 'default'}
          onPress={() => setTheme('light')}
        >
          Light
        </Button>
        <Button
          size="sm"
          variant={active === 'dark' ? 'solid' : 'bordered'}
          color={active === 'dark' ? 'primary' : 'default'}
          onPress={() => setTheme('dark')}
        >
          Dark
        </Button>
      </div>
      <div className="text-xs text-gray-500">Applies immediately.</div>
    </div>
  )
}
