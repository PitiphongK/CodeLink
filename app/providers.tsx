'use client'

import { HeroUIProvider } from '@heroui/react'
import { ToastProvider } from '@heroui/toast'
import {ThemeProvider as NextThemesProvider} from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <ToastProvider placement="top-center" />
      </NextThemesProvider>
    </HeroUIProvider>
  )
}