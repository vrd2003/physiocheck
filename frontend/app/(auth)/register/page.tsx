'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Activity, Mail, Lock, User, Eye, EyeOff, Stethoscope, User as PatientIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'doctor' | 'patient'>('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during registration'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100">
            <Mail className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We`ve sent a confirmation link to <strong>{email}</strong>
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Please check your inbox and click the link to verify your account.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors duration-200"
            >
              Return to login
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <Activity className="w-12 h-12 text-teal-600" />
              <motion.div
                className="absolute inset-0 rounded-full bg-teal-600/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Start your journey with PhysioCheck
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-slate-200">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-coral-50 border border-coral-200 text-coral-800 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`relative p-4 border rounded-lg text-center transition-all duration-200 ${
                    role === 'patient'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  <PatientIcon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`relative p-4 border rounded-lg text-center transition-all duration-200 ${
                    role === 'doctor'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  <Stethoscope className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Doctor</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-700">
                I agree to the{' '}
                <Link href="/terms" className="text-teal-600 hover:text-teal-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-teal-600 hover:text-teal-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-teal-600 hover:text-teal-500 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}