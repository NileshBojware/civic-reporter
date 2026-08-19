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

  // Pre-fill mock credentials for easy testing
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
    <div className="flex-grow flex items-center justify-center px-4 py-16 bg-zinc-950/20">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-white">{t('login.title')}</h2>
          <p className="text-zinc-400 text-xs mt-1.5">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed">
            <div>{error}</div>
            {showConfirmOption && (
              <button
                type="button"
                onClick={handleAutoConfirm}
                disabled={confirming}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition text-xs shadow-md shadow-purple-600/20 hover:shadow-purple-600/30 active:scale-95 cursor-pointer"
              >
                {confirming ? 'Confirming Email...' : 'Confirm Email & Log In Now'}
              </button>
            )}
          </div>
        )}

        {/* Mock Mode Assistance Tooltip */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-[11px] text-zinc-400">
            <span className="text-purple-400 font-bold block mb-1">💡 Demo Mode Active</span>
            Quickly test roles by selecting a profile preset:
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => selectMockRole('citizen')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                  role === 'citizen'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <User className="w-3 h-3" />
                Citizen Preset
              </button>
              <button
                type="button"
                onClick={() => selectMockRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                  role === 'admin'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'
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
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">{t('login.fieldEmail')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">{t('login.fieldPass')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-extrabold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none transition-all duration-200 cursor-pointer"
          >
            {loading ? t('login.btnLogging') : t('login.btnLogin')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            {t('login.noAcc')}{' '}
            <Link href="/signup" className="font-bold text-purple-400 hover:text-purple-300 transition-colors">
              {t('login.signupLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
