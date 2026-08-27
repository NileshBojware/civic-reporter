'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Shield, User, Eye, EyeOff } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen')
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
      if (isSupabaseConfigured && supabase) {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (err) {
          if (err.message?.toLowerCase().includes('confirm')) {
            setShowConfirmOption(true)
          }
          throw err
        }

        // Fetch user profile to check role and redirect accordingly
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle()

          if (profile?.role === 'admin') {
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
        const isAdmin = email.toLowerCase().includes('admin') || role === 'admin'
        const mockUser = {
          id: isAdmin ? 'admin-id-123' : `citizen-${Date.now()}`,
          full_name: isAdmin ? 'Municipal Admin (Mock)' : 'John Citizen (Mock)',
          role: isAdmin ? 'admin' : 'citizen',
          email: email || 'citizen@example.com',
          created_at: new Date().toISOString(),
        }

        localStorage.setItem('civic_reporter_user', JSON.stringify(mockUser))
        window.dispatchEvent(new Event('auth-change'))

        // Redirect based on role
        if (isAdmin) {
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
        body: JSON.stringify({ email }),
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to confirm email')
      }

      // Auto login after confirmation
      const { data: confirmData, error: loginErr } = await supabase!.auth.signInWithPassword({
        email,
        password,
      })

      if (loginErr) throw loginErr

      if (confirmData?.user) {
        const { data: profile } = await supabase!
          .from('profiles')
          .select('role')
          .eq('id', confirmData.user.id)
          .maybeSingle()

        if (profile?.role === 'admin') {
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

  const selectMockRole = (selectedRole: 'citizen' | 'admin') => {
    setRole(selectedRole)
    if (selectedRole === 'admin') {
      setEmail('shashiadmin@gmail.com')
      setPassword('admin@123321')
    } else {
      setEmail('citizen@gmail.com')
      setPassword('citizen123')
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas text-body">
      <div className="w-full max-w-md p-8 rounded-lg border border-hairline bg-canvas shadow-md">
        
        <div className="text-center mb-8">
          <h2 className="text-display-sm text-ink mb-2">{t('login.title')}</h2>
          <p className="text-body-sm text-body">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-body-sm font-semibold leading-relaxed">
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

        {/* Mock Mode Assistance Tooltip */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-3.5 rounded-lg bg-surface-soft border border-hairline text-caption text-body">
            <span className="text-brand-accent font-bold block mb-1">💡 Demo Mode Active</span>
            Quickly test roles by selecting a profile preset:
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => selectMockRole('citizen')}
                className={`text-[10px] h-8 px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  role === 'citizen'
                    ? 'bg-primary text-on-primary border border-primary'
                    : 'btn-secondary'
                }`}
              >
                <User className="w-3 h-3" />
                Citizen Preset
              </button>
              <button
                type="button"
                onClick={() => selectMockRole('admin')}
                className={`text-[10px] h-8 px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-primary text-on-primary border border-primary'
                    : 'btn-secondary'
                }`}
              >
                <Shield className="w-3 h-3" />
                Admin Preset
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="••••••••"
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
            {loading ? t('login.btnLogging') : t('login.btnLogin')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-caption text-muted">
            {t('login.noAcc')}{' '}
            <Link href="/signup" className="font-bold text-brand-accent hover:underline">
              {t('login.signupLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
