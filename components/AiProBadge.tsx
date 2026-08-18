import React from 'react'
import { Sparkles, Lock } from 'lucide-react'

export function AiProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-500/10">
      <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
      <span>AI Pro</span>
      <Lock className="w-2.5 h-2.5 ml-0.5 text-purple-300/80" />
    </span>
  )
}
