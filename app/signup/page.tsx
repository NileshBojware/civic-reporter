'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, User, Eye, EyeOff } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { t } = useLanguage()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'citizen',
            },
          },
        })

        if (err) throw err

        // Auto-confirm email programmatically
        try {
          await fetch('/api/auth/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })
        } catch (confirmErr) {
          console.error('Failed to auto-confirm email:', confirmErr)
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        // Mock mode signup simulation
        const mockUser = {
          id: `user-${Date.now()}`,
          full_name: fullName || 'New User',
          role: 'citizen',
          email: email || 'user@example.com',
          created_at: new Date().toISOString(),
        }

        localStorage.setItem('civic_reporter_user', JSON.stringify(mockUser))

        // Save mock profile in a mock database profiles array in localStorage
        const mockProfiles = localStorage.getItem('civic_reporter_profiles') || '[]'
        const profilesList = JSON.parse(mockProfiles)
        profilesList.push(mockUser)
        localStorage.setItem('civic_reporter_profiles', JSON.stringify(profilesList))

        // Dispatch auth-change event
        window.dispatchEvent(new Event('auth-change'))

        setSuccess(true)
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas text-body">
      <div className="w-full max-w-md p-8 rounded-lg border border-hairline bg-canvas shadow-md">
        
        <div className="text-center mb-8">
          <h2 className="text-display-sm text-ink mb-2">{t('signup.title')}</h2>
          <p className="text-body-sm text-body">{t('signup.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-body-sm font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-md bg-status-resolved/10 border border-status-resolved/20 text-status-resolved text-body-sm font-semibold leading-relaxed">
            {isSupabaseConfigured
              ? 'Registration successful! (Email automatically verified for convenience). Redirecting to login...'
              : 'Sign up successful! Logging you in...'}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">{t('signup.fieldName')}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 h-10 rounded-md bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">{t('login.fieldEmail')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 h-10 rounded-md bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">{t('login.fieldPass')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-md bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-10 text-body-sm shadow-sm"
          >
            {loading ? t('signup.btnSigning') : t('signup.btnSignup')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-caption text-muted">
            {t('signup.hasAcc')}{' '}
            <Link href="/login" className="font-bold text-brand-accent hover:underline">
              {t('signup.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
