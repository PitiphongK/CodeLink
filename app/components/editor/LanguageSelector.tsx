'use client'

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react'

import { Languages, languageOptions } from '@/app/interfaces/languages'

interface LanguageSelectorProps {
  /** Currently selected language */
  language: Languages
  /** Callback when language changes */
  onLanguageChange: (language: Languages) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Dropdown component for selecting the editor language
 */
export default function LanguageSelector({
  language,
  onLanguageChange,
  disabled = false,
  className = '',
}: LanguageSelectorProps) {
  const getLanguageIcon = (value: Languages) => {
    switch (value) {
      case Languages.JAVASCRIPT:
        return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" width="14" height="14" />
      case Languages.TYPESCRIPT:
        return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" width="14" height="14" />
      case Languages.PYTHON:
        return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" width="14" height="14" />
      default:
        return null
    }
  }

  return (
    <div
      className={`absolute bottom-4 right-4 z-10 ${className} ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      }`}
      aria-disabled={disabled}
    >
      <Dropdown>
        <DropdownTrigger>
          <Button
            className="capitalize bg-surface-secondary hover:bg-surface-elevated text-text-primary"
            variant="bordered"
            isDisabled={disabled}
            startContent={getLanguageIcon(language)}
          >
            {language}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          aria-label="Language selection"
          selectedKeys={[language]}
          selectionMode="single"
          variant="flat"
          items={languageOptions}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as Languages
            onLanguageChange(selected)
          }}
        >
          {(option) => (
            <DropdownItem key={option.value} startContent={getLanguageIcon(option.value)}>
              {option.label}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
