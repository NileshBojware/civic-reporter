import React from 'react'
import { Sparkles, Lock } from 'lucide-react'

export function AiProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-caption font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/25 shadow-sm">
      <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
      <span>AI Pro</span>
      <Lock className="w-2.5 h-2.5 ml-0.5 text-brand-accent/70" />
    </span>
  )
}
