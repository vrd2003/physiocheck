'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Menu, X, User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, role, signOut } = useAuth()
  const pathname = usePathname()

  const doctorLinks = [
    { href: '/doctor/dashboard', label: 'Dashboard' },
    { href: '/doctor/add-patient', label: 'Add Patient' },
    { href: '/doctor/patients', label: 'Patients' },
    { href: '/doctor/assign-exercises', label: 'Assign Exercises' },
    { href: '/doctor/sessions', label: 'Sessions' },
  ]

  const patientLinks = [
    { href: '/patient/dashboard', label: 'Dashboard' },
    { href: '/patient/exercises', label: 'My Exercises' },
    { href: '/patient/live-session', label: 'Live Session' },
    { href: '/patient/history', label: 'History' },
  ]

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/public/exercises', label: 'Exercise Library' },
    { href: '/login', label: 'Login' },
    { href: '/register', label: 'Register' },
  ]

  const links = !user
    ? publicLinks
    : role === 'doctor'
    ? doctorLinks
    : patientLinks

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Activity className="w-8 h-8 text-teal-600" />
              <motion.div
                className="absolute inset-0 rounded-full bg-teal-600/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Physio<span className="text-teal-600">Check</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-1 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-teal-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop User */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{role}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-slate-100"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg ${
                    isActive(link.href)
                      ? 'bg-teal-50 text-teal-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <button
                  onClick={signOut}
                  className="w-full text-left px-3 py-2 mt-2 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Sign out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
