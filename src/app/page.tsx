'use client'

import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-obsidian-accent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-dark via-obsidian-darker to-obsidian-dark">
      <Navigation />
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-obsidian-purple/20 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-obsidian-accent/20 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-obsidian-purple-light/20 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          className="max-w-5xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-extrabold text-white md:text-7xl lg:text-8xl leading-tight">
            Turn Your{' '}
            <span className="text-blue-400" style={{ color: '#60A5FA' }}>
              Shopify Data
            </span>{' '}
            Into Revenue
          </h1>
          <p className="mt-6 text-xl text-gray-300 md:text-2xl max-w-4xl mx-auto leading-relaxed">
            Stop guessing what drives your sales. Our AI-powered analytics platform reveals the hidden patterns 
            in your customer behavior, identifies your most profitable segments, and shows you exactly where to 
            focus your marketing budget for maximum ROI.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 mt-12 sm:flex-row">
            <Link
              href="/auth/signup"
              className="w-full px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-obsidian-accent to-obsidian-purple rounded-xl shadow-2xl sm:w-auto hover:shadow-obsidian-accent/25 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-obsidian-accent transform transition-all duration-300"
            >
              Start Growing Revenue Today
            </Link>
            <Link
              href="/auth/signin"
              className="w-full px-10 py-4 text-lg font-semibold text-foreground glass-card rounded-xl shadow-lg sm:w-auto hover:bg-obsidian-card/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-obsidian-accent transform hover:scale-105 transition-all duration-300"
            >
              Access Your Dashboard
            </Link>
          </div>

          {/* Features */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div 
              className="p-8 glass-card rounded-2xl shadow-xl border border-obsidian-border/50 hover:border-obsidian-accent/30 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-obsidian-accent/20 to-obsidian-purple/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-obsidian-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Revenue Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Discover which products, customers, and campaigns generate the most profit. Make data-driven decisions that directly impact your bottom line.</p>
              <div className="flex items-center text-obsidian-accent text-sm font-medium">
                <span>Learn More</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>

            <motion.div 
              className="p-8 glass-card rounded-2xl shadow-xl border border-obsidian-border/50 hover:border-obsidian-purple/30 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-obsidian-purple/20 to-obsidian-purple-light/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-obsidian-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Customer Profiling</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Identify your highest-value customers and understand exactly what makes them buy. Create targeted campaigns that convert better and cost less.</p>
              <div className="flex items-center text-obsidian-purple text-sm font-medium">
                <span>Learn More</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>

            <motion.div 
              className="p-8 glass-card rounded-2xl shadow-xl border border-obsidian-border/50 hover:border-obsidian-accent/30 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-obsidian-accent-light/20 to-obsidian-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-obsidian-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Instant Setup</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Connect your Shopify store in under 2 minutes. No technical knowledge required. Start seeing insights immediately.</p>
              <div className="flex items-center text-obsidian-accent-light text-sm font-medium">
                <span>Learn More</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
