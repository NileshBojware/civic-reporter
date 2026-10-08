'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LANGUAGES } from '@/lib/translations'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  currentValue?: string
  mode?: 'append' | 'replace'
  className?: string
  buttonSize?: 'sm' | 'md'
  placeholderLabel?: string
}

// BCP-47 speech recognition language tag mapping for all 8 supported languages
const SPEECH_LANGUAGE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  ur: 'ur-IN',
}

export function VoiceInputButton({
  onTranscript,
  currentValue = '',
  mode = 'append',
  className = '',
  buttonSize = 'sm',
  placeholderLabel,
}: VoiceInputButtonProps) {
  const { language, t } = useLanguage()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [interimText, setInterimText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const currentLangCode = SPEECH_LANGUAGE_CODES[language] || 'en-IN'
  const langObj = LANGUAGES.find((l) => l.code === language)
  const langName = langObj ? langObj.nativeLabel : 'English'

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore error on unmount
        }
      }
    }
  }, [])

  const startListening = () => {
    setErrorMessage(null)
    setInterimText('')

    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage(t('voice.notSupported') || 'Voice input is not supported in this browser.')
      return
    }

    try {
      // Stop any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.lang = currentLangCode
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setErrorMessage(null)
      }

      recognition.onresult = (event: any) => {
        let finalTrans = ''
        let interimTrans = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTrans += transcript
          } else {
            interimTrans += transcript
          }
        }

        if (interimTrans) {
          setInterimText(interimTrans)
        }

        if (finalTrans) {
          setInterimText('')
          const trimmedFinal = finalTrans.trim()
          if (trimmedFinal) {
            if (mode === 'append' && currentValue && currentValue.trim()) {
              const separator = currentValue.trim().endsWith('.') || currentValue.trim().endsWith('?') ? ' ' : ' '
              onTranscript(currentValue.trim() + separator + trimmedFinal)
            } else {
              onTranscript(trimmedFinal)
            }
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        setIsListening(false)
        setInterimText('')

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage(t('voice.permissionDenied') || 'Microphone permission denied.')
        } else if (event.error === 'no-speech') {
          // User stayed silent, no critical error
        } else if (event.error === 'language-not-supported') {
          setErrorMessage(`Language ${langName} not supported on this device.`)
        } else {
          setErrorMessage(`Voice error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimText('')
      }

      recognition.start()
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
      setErrorMessage(err.message || 'Could not access microphone.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsListening(false)
    setInterimText('')
  }

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        title={
          isListening
            ? t('voice.stop') || `Listening in ${langName}... Click to stop`
            : t('voice.start') || `Speak in ${langName}`
        }
        className={`inline-flex items-center justify-center gap-1 rounded-md transition-all duration-200 cursor-pointer select-none ${
          buttonSize === 'sm'
            ? 'h-7 px-2 text-xs font-semibold'
            : 'h-8 px-2.5 text-xs font-semibold'
        } ${
          isListening
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30 animate-pulse'
            : 'bg-surface-soft hover:bg-surface-strong text-muted hover:text-ink border border-hairline'
        }`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <MicOff className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold tracking-tight">
              {langName}
            </span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-brand-accent shrink-0" />
            <span className="text-[11px] font-medium text-body">
              {placeholderLabel || langName}
            </span>
          </>
        )}
      </button>

      {/* Live Interim Speech Toast or Active Recording Badge */}
      {isListening && (
        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold animate-pulse flex items-center gap-1">
          <span>{interimText ? `"${interimText}..."` : `${t('voice.listening') || 'Listening in'} ${langName}...`}</span>
        </span>
      )}

      {/* Error Tooltip */}
      {errorMessage && (
        <div className="absolute left-0 -bottom-7 z-20 flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 shadow-sm whitespace-nowrap">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-1 text-rose-400 hover:text-rose-600 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
