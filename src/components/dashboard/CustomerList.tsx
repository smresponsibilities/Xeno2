'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Customer {
  id: number
  email?: string
  first_name?: string
  last_name?: string
  full_name: string
  total_spent?: string
  orders_count?: number
  created_at?: string
  updated_at?: string
  state?: string
  verified_email?: boolean
  has_address: boolean
  company?: string | null
  display_type?: string
  pii_available?: boolean
}

interface CustomerListProps {
  animationVariants?: any
}

export default function CustomerList({ animationVariants }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  const fetchCustomers = async (search?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (demoMode) params.append('demo', 'true')
      
      const url = `/api/customers?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [demoMode])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCustomers(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    fetchCustomers()
  }

  const getInitials = (customer: Customer) => {
    const firstName = customer.first_name || ''
    const lastName = customer.last_name || ''
    
    if (firstName || lastName) {
      const first = firstName ? firstName.charAt(0).toUpperCase() : ''
      const last = lastName ? lastName.charAt(0).toUpperCase() : ''
      return first + last || '?'
    }
    
    return '??'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-obsidian-border rounded-lg animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-obsidian-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-obsidian-muted rounded w-32"></div>
              <div className="h-3 bg-obsidian-muted rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-obsidian-muted rounded w-16"></div>
            <div className="h-3 bg-obsidian-muted rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <motion.div
      variants={animationVariants}
      className="p-6 glass-card rounded-2xl shadow-xl border border-obsidian-border/50"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-4 sm:mb-0">
          All Customers ({customers.length})
          {demoMode && <span className="text-sm font-normal text-obsidian-accent ml-2">(Demo Mode - Real Customer Names)</span>}
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Demo Mode Toggle */}
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              demoMode 
                ? 'bg-obsidian-accent text-white hover:bg-obsidian-accent/80' 
                : 'bg-obsidian-border text-muted-foreground hover:bg-obsidian-card'
            }`}
          >
            {demoMode ? '🎭 Demo Mode ON' : '🎭 Demo Mode OFF'}
          </button>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by name..."
                className="pl-10 pr-4 py-2 border border-obsidian-border rounded-lg focus:ring-2 focus:ring-obsidian-accent focus:border-obsidian-accent bg-obsidian-card text-foreground placeholder-muted-foreground w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-obsidian-accent to-obsidian-purple text-white rounded-lg hover:shadow-lg hover:shadow-obsidian-accent/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-obsidian-muted text-foreground rounded-lg hover:bg-obsidian-border transition-colors duration-200"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* PII Success Notice */}
      {!demoMode && customers.length > 0 && customers.some(c => c.pii_available) && (
        <div className="mb-4 p-4 glass-card border border-obsidian-accent/30 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-obsidian-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-obsidian-accent">Full Customer Data Available</h4>
              <p className="text-sm text-muted-foreground mt-1">
                ✅ Real customer names and contact information are now accessible via API. 
                Your Shopify store upgrade provides complete customer data for better insights and analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 glass-card border border-destructive/30 text-destructive-foreground rounded-lg">
          Error: {error}
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader />
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-obsidian-border rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-lg">
            {searchQuery ? `No customers found matching "${searchQuery}"` : 'No customers found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-4 glass-card rounded-lg hover:bg-obsidian-card/50 transition-all duration-200 border border-obsidian-border/50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-obsidian-accent to-obsidian-purple rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {getInitials(customer)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground text-lg">
                      {customer.full_name}
                    </h4>
                    {customer.verified_email && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-obsidian-accent/20 text-obsidian-accent">
                        Verified
                      </span>
                    )}
                    {customer.company && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-obsidian-purple/20 text-obsidian-purple">
                        {customer.company}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{customer.email || 'No email'}</span>
                    <span>•</span>
                    <span>ID: {customer.id}</span>
                    <span>•</span>
                    <span>Joined: {formatDate(customer.created_at)}</span>
                    {customer.has_address && (
                      <>
                        <span>•</span>
                        <span className="text-obsidian-accent">Has Address</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-obsidian-accent">
                  ${parseFloat(customer.total_spent || '0').toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer.orders_count || 0} orders
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
