'use client'

import { useEffect, useMemo, useState } from 'react'

import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'

function ThemeCard({
  label,
  value,
  isActive,
  onSelect,
  preview,
}: {
  label: string
  value: string
  isActive: boolean
  onSelect: () => void
  preview: React.ReactNode
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col gap-2 w-full text-left focus:outline-none group`}
    >
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-all ${isActive
            ? 'border-blue-500 shadow-md'
            : 'border-border-strong hover:border-default-400'
          }`}
      >
        {preview}
        {isActive && (
          <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <Check size={11} strokeWidth={3} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'border-blue-500' : 'border-default-400 group-hover:border-default-600'
            }`}
        >
          {isActive && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>
        <span className={`text-sm ${isActive ? 'text-text-primary font-medium' : 'text-text-secondary'
          }`}>
          {label}
        </span>
      </div>
    </button>
  )
}

function LightPreview() {
  return (
    <div className="h-28 bg-white flex overflow-hidden">
      {/* sidebar */}
      <div className="w-12 bg-gray-100 p-1.5 flex flex-col gap-1.5 border-r border-gray-200">
        <div className="w-full h-2 rounded bg-gray-300" />
        <div className="w-3/4 h-2 rounded bg-gray-200" />
        <div className="w-full h-2 rounded bg-blue-200" />
        <div className="w-3/4 h-2 rounded bg-gray-200" />
        <div className="w-full h-2 rounded bg-gray-200" />
      </div>
      {/* content */}
      <div className="flex-1 p-2 flex flex-col gap-1.5">
        <div className="flex gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-100 rounded" />
        <div className="h-2 bg-gray-100 rounded w-5/6" />
        <div className="h-5 bg-gray-200 rounded mt-1" />
        <div className="h-2 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}

function DarkPreview() {
  return (
    <div className="h-28 bg-[#1e1e1e] flex overflow-hidden">
      {/* sidebar */}
      <div className="w-12 bg-[#252526] p-1.5 flex flex-col gap-1.5 border-r border-[#3e3e3e]">
        <div className="w-full h-2 rounded bg-[#3e3e3e]" />
        <div className="w-3/4 h-2 rounded bg-[#333]" />
        <div className="w-full h-2 rounded bg-blue-900" />
        <div className="w-3/4 h-2 rounded bg-[#333]" />
        <div className="w-full h-2 rounded bg-[#333]" />
      </div>
      {/* content */}
      <div className="flex-1 p-2 flex flex-col gap-1.5">
        <div className="flex gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <div className="h-3 bg-[#3e3e3e] rounded w-3/4" />
        <div className="h-2 bg-[#2d2d2d] rounded" />
        <div className="h-2 bg-[#2d2d2d] rounded w-5/6" />
        <div className="h-5 bg-[#3e3e3e] rounded mt-1" />
        <div className="h-2 bg-[#2d2d2d] rounded w-2/3" />
      </div>
    </div>
  )
}

function SystemPreview() {
  return (
    <div className="h-28 bg-gray-100 flex overflow-hidden">
      {/* left half light */}
      <div className="w-1/2 bg-white flex flex-col p-1.5 gap-1.5 border-r border-gray-200">
        <div className="flex gap-1 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
        <div className="h-2 bg-gray-200 rounded" />
        <div className="h-2 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-2 bg-gray-100 rounded w-1/2" />
      </div>
      {/* right half dark */}
      <div className="w-1/2 bg-[#1e1e1e] flex flex-col p-1.5 gap-1.5">
        <div className="flex gap-1 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        </div>
        <div className="h-2 bg-[#3e3e3e] rounded" />
        <div className="h-2 bg-[#2d2d2d] rounded w-3/4" />
        <div className="h-4 bg-[#3e3e3e] rounded" />
        <div className="h-2 bg-[#2d2d2d] rounded w-1/2" />
      </div>
    </div>
  )
}

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const active = useMemo(() => {
    if (!mounted) return null
    return theme === 'system' ? 'system' : theme
  }, [mounted, theme])

  if (!mounted) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      <ThemeCard
        label="Light Mode"
        value="light"
        isActive={active === 'light'}
        onSelect={() => setTheme('light')}
        preview={<LightPreview />}
      />
      <ThemeCard
        label="Dark Mode"
        value="dark"
        isActive={active === 'dark'}
        onSelect={() => setTheme('dark')}
        preview={<DarkPreview />}
      />
      <ThemeCard
        label="System"
        value="system"
        isActive={active === 'system'}
        onSelect={() => setTheme('system')}
        preview={<SystemPreview />}
      />
    </div>
  )
}
