'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'
import { DEPARTMENTS, getDepartmentByEmail } from '@/lib/departments'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmOption, setShowConfirmOption] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { t } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowConfirmOption(false)
    setLoading(true)

    try {
      const trimmedEmail = email.trim()
      const matchedDept = getDepartmentByEmail(trimmedEmail)
      const isDeptAdmin = Boolean(matchedDept) || trimmedEmail.toLowerCase().includes('admin')

      if (isSupabaseConfigured && supabase) {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })

        if (err) {
          if (err.message?.toLowerCase().includes('confirm')) {
            setShowConfirmOption(true)
          }
          throw err
        }

        // Fetch user profile to check role and department
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle()

          const isAdmin = profile?.role === 'admin' || isDeptAdmin || data.user.user_metadata?.role === 'admin'

          if (isAdmin) {
            router.push('/admin')
          } else {
            router.push('/')
          }
        } else {
          router.push('/')
        }
        
        router.refresh()
      } else {
        // Mock mode login simulation
        const dept = matchedDept || (isDeptAdmin ? DEPARTMENTS[0] : null)
        const mockUser = {
          id: dept ? `admin-${dept.id}` : (isDeptAdmin ? 'admin-pwd' : `citizen-${Date.now()}`),
          full_name: dept ? dept.adminTitle : (isDeptAdmin ? 'Municipal Admin' : 'John Citizen'),
          role: (dept || isDeptAdmin) ? 'admin' : 'citizen',
          department: dept ? dept.id : (isDeptAdmin ? 'pwd' : undefined),
          email: trimmedEmail || (dept ? dept.adminEmail : 'citizen@shehercare.in'),
          created_at: new Date().toISOString(),
        }

        localStorage.setItem('civic_reporter_user', JSON.stringify(mockUser))
        window.dispatchEvent(new Event('auth-change'))

        if (mockUser.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoConfirm = async () => {
    setConfirming(true)
    setError('')
    try {
      const res = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to confirm email')
      }

      // Auto login after confirmation
      const { data: confirmData, error: loginErr } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginErr) throw loginErr

      if (confirmData?.user) {
        const { data: profile } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', confirmData.user.id)
          .maybeSingle()

        const isDeptAdmin = Boolean(getDepartmentByEmail(email.trim()))
        if (profile?.role === 'admin' || isDeptAdmin) {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to verify email.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-12 md:py-16 bg-canvas text-body">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-hairline bg-canvas shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-display-sm text-ink font-bold tracking-tight">
            {t('login.title') || 'Welcome Back'}
          </h2>
          <p className="text-caption text-muted leading-relaxed">
            {t('login.subtitle') || 'Log in to report issues, upvote, and track resolutions'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-status-rejected/10 border border-status-rejected/25 text-status-rejected text-body-sm font-semibold leading-relaxed">
            <div>{error}</div>
            {showConfirmOption && (
              <button
                type="button"
                onClick={handleAutoConfirm}
                disabled={confirming}
                className="mt-3 w-full btn-primary h-10 text-caption shadow-sm"
              >
                {confirming ? 'Confirming Email...' : 'Confirm Email & Log In Now'}
              </button>
            )}
          </div>
        )}

        {/* Login Form — Manual Entry for Admin & Citizens */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">
              {t('login.fieldEmail') || 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 h-11 rounded-xl bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">
              {t('login.fieldPass') || 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 h-11 rounded-xl bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 text-body-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>{t('login.btnLogging') || 'Logging In...'}</span>
              </div>
            ) : (
              <span>{t('login.btnLogin') || 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <div className="text-center text-caption text-muted border-t border-hairline pt-4 flex items-center justify-center gap-1.5">
          <span>{t('login.noAcc') || "Don't have an account?"}</span>
          <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            {t('login.signupLink') || 'Create account'}
          </Link>
        </div>

      </div>
    </div>
  )
}
