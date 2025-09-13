'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signIn(email, password)
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
          <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
          <p className="mt-2 text-muted-foreground">Access your revenue insights dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-destructive-foreground glass-card border border-destructive/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-obsidian-border rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-obsidian-accent focus:border-obsidian-accent bg-obsidian-card text-foreground"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-obsidian-accent to-obsidian-purple hover:shadow-lg hover:shadow-obsidian-accent/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-obsidian-accent disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
          >
            {loading ? 'Signing in...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-obsidian-accent hover:text-obsidian-purple transition-colors duration-200">
              Start your free trial
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
