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
  /** Additional class names */
  className?: string
}

/**
 * Dropdown component for selecting the editor language
 */
export default function LanguageSelector({
  language,
  onLanguageChange,
  className = '',
}: LanguageSelectorProps) {
  return (
    <div className={`absolute bottom-4 right-4 z-10 ${className}`}>
      <Dropdown>
        <DropdownTrigger>
          <Button
            className="capitalize bg-surface-secondary hover:bg-surface-elevated text-text-primary"
            variant="bordered"
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
            <DropdownItem key={option.value}>{option.label}</DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
