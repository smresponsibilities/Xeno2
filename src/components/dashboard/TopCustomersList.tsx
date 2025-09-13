'use client'

import { motion } from 'framer-motion'

interface Customer {
  // Database fields (snake_case)
  first_name?: string | null
  last_name?: string | null
  total_spent?: number
  email?: string
  orders_count?: number
  
  // Shopify API fields (might be present as fallback)
  name?: string
  totalSpend?: number
}

interface TopCustomersListProps {
  customers: Customer[]
  isLoading: boolean
  animationVariants?: any
}

export default function TopCustomersList({ 
  customers, 
  isLoading, 
  animationVariants 
}: TopCustomersListProps) {
  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-obsidian-border rounded-lg animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-obsidian-muted rounded-full"></div>
            <div className="h-4 bg-obsidian-muted rounded w-24"></div>
          </div>
          <div className="h-4 bg-obsidian-muted rounded w-16"></div>
        </div>
      ))}
    </div>
  )

  const getInitials = (customer: Customer) => {
    // Prioritize first_name/last_name from database
    const firstName = customer.first_name
    const lastName = customer.last_name
    
    if (firstName || lastName) {
      const first = firstName ? firstName.charAt(0).toUpperCase() : ''
      const last = lastName ? lastName.charAt(0).toUpperCase() : ''
      return first + last || '?'
    }
    
    // Fallback to 'name' field (from Shopify API)
    if (customer.name) {
      const parts = customer.name.split(' ')
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
      } else if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase()
      }
    }
    
    return '??'
  }

  const getFullName = (customer: Customer) => {
    // Prioritize first_name/last_name from database
    const firstName = customer.first_name
    const lastName = customer.last_name
    
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown Customer'
    }
    
    // Fallback to 'name' field (from Shopify API)
    if (customer.name) {
      return customer.name
    }
    
    return 'Unknown Customer'
  }

  const getTotalSpent = (customer: Customer) => {
    // Try both possible field names
    return customer.totalSpend || customer.total_spent || 0
  }

  return (
    <motion.div
      variants={animationVariants}
      className="p-6 glass-card rounded-2xl shadow-xl border border-obsidian-border/50"
    >
      <h3 className="text-xl font-bold text-foreground mb-6">Top 5 Customers</h3>
      
      {isLoading ? (
        <SkeletonLoader />
      ) : customers.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-obsidian-border rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground">No customers found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((customer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 glass-card rounded-lg hover:bg-obsidian-card/50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-obsidian-accent to-obsidian-purple rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {getInitials(customer)}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {getFullName(customer)}
                  </p>
                  <p className="text-sm text-muted-foreground">#{index + 1} Customer</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-obsidian-accent">
                  ${getTotalSpent(customer).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
