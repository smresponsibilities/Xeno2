'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    setIsDropdownOpen(false)
  }

  return (
    <nav className="glass-dark border-b border-obsidian-border/50 sticky top-0 z-50">
      <div className="container px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={user ? '/dashboard' : '/'} className="text-2xl font-bold bg-gradient-to-r from-obsidian-accent to-obsidian-purple bg-clip-text text-transparent">
            XenoInsights
          </Link>
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-obsidian-accent to-obsidian-purple flex items-center justify-center text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-obsidian-accent hover:scale-105 transition-transform duration-200"
              >
                {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-2xl py-2 z-50 border border-obsidian-border/50">
                  <div className="px-4 py-3 text-sm text-foreground border-b border-obsidian-border/30">
                    <div className="font-semibold">{user.user_metadata?.full_name || 'User'}</div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-3 text-sm text-foreground hover:bg-obsidian-card/50 transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-4">
              <Link
                href="/auth/signin"
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-obsidian-card/50"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-obsidian-accent to-obsidian-purple text-white hover:shadow-lg hover:shadow-obsidian-accent/25 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
