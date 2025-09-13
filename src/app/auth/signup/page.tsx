'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-obsidian-dark via-obsidian-darker to-obsidian-dark">
      <motion.div
        className="w-full max-w-md p-8 glass-card rounded-2xl shadow-2xl border border-obsidian-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Start Your Free Trial</h2>
          <p className="mt-2 text-muted-foreground">Join thousands of merchants growing their revenue with data</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-destructive-foreground glass-card border border-destructive/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-obsidian-border rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-obsidian-accent focus:border-obsidian-accent bg-obsidian-card text-foreground"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-obsidian-border rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-obsidian-accent focus:border-obsidian-accent bg-obsidian-card text-foreground"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-obsidian-border rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-obsidian-accent focus:border-obsidian-accent bg-obsidian-card text-foreground"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-obsidian-border rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-obsidian-accent focus:border-obsidian-accent bg-obsidian-card text-foreground"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-obsidian-accent to-obsidian-purple hover:shadow-lg hover:shadow-obsidian-accent/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-obsidian-accent disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
          >
            {loading ? 'Creating account...' : 'Start Free Trial'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-obsidian-accent hover:text-obsidian-purple transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
