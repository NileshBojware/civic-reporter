'use client'

import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-hairline bg-canvas hover:bg-surface-soft text-muted hover:text-ink transition-all duration-200 cursor-pointer shrink-0"
    >
      {/* Sun icon — visible in dark mode (click → go light) */}
      <Sun
        className={`absolute w-4 h-4 transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
      />
      {/* Moon icon — visible in light mode (click → go dark) */}
      <Moon
        className={`absolute w-4 h-4 transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
    </button>
  )
}
