'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import StatCard from '@/components/dashboard/StatCard'
import TopCustomersList from '@/components/dashboard/TopCustomersList'
import CustomerList from '@/components/dashboard/CustomerList'
import TabbedCharts from '@/components/dashboard/TabbedCharts'
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign,
  RefreshCw 
} from 'lucide-react'

interface KPIs {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue?: number
  source?: string
}

interface Customer {
  first_name?: string | null
  last_name?: string | null
  total_spent?: number
  name?: string
  email?: string
  totalSpend?: number
}

interface ChartData {
  date: string
  count: number
  revenue: number
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  
  // Dashboard data state
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [topCustomers, setTopCustomers] = useState<Customer[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date
  })
  const [endDate, setEndDate] = useState(new Date())

  // Redirect if not authenticated (temporarily disabled for testing)
  useEffect(() => {
    if (!loading && !user) {
      // TODO: Uncomment this line when you want to enforce authentication
      // router.push('/auth/signin')
      console.log('Authentication disabled for testing - showing dashboard anyway')
    }
  }, [user, loading, router])

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    // For testing, always fetch data even without user
    // if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching dashboard data for date range:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      })
      
      const [kpisResponse, customersResponse, chartResponse] = await Promise.all([
        fetch('/api/insights/kpis', { cache: 'no-store' }),
        fetch('/api/insights/top-customers', { cache: 'no-store' }),
        fetch(`/api/insights/orders-over-time?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, { cache: 'no-store' })
      ])

      console.log('Response statuses:', {
        kpis: kpisResponse.status,
        customers: customersResponse.status,
        chart: chartResponse.status
      })

      // Handle KPIs
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json()
        console.log('KPIs data received:', kpisData)
        setKpis(kpisData)
      } else {
        console.error('KPIs request failed:', kpisResponse.status, await kpisResponse.text())
      }

      // Handle customers
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        console.log('Customers data received:', customersData)
        setTopCustomers(Array.isArray(customersData) ? customersData : [])
      } else {
        console.error('Customers request failed:', customersResponse.status, await customersResponse.text())
      }

      // Handle chart data
      if (chartResponse.ok) {
        const chartData = await chartResponse.json()
        console.log('Chart data received:', chartData)
        setChartData(Array.isArray(chartData) ? chartData : [])
      } else {
        console.error('Chart request failed:', chartResponse.status, await chartResponse.text())
      }
      
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [user, startDate, endDate])

  // Manual sync function
  const syncData = useCallback(async () => {
    // For testing, allow sync even without user
    // if (!user) return
    
    setIsSyncing(true)
    setError(null)
    
    try {
      console.log('Starting manual data sync...')
      
      const response = await fetch('/api/ingestion/start', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Sync failed')
      }

      const data = await response.json()
      console.log('Sync completed:', data)
      
      setLastSynced(new Date())
      
      // Refresh data after sync
      await fetchData()
      
    } catch (error: any) {
      console.error('Sync failed:', error)
      setError(error.message || 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }, [user, fetchData])

  // Initial data fetch
  useEffect(() => {
    // For testing, always fetch data
    if (!loading) {
      fetchData()
    }
  }, [loading, fetchData])

  // Refetch data when date range changes
  useEffect(() => {
    if (!loading) {
      console.log('Date range changed, refetching data...')
      fetchData()
    }
  }, [startDate, endDate, loading, fetchData])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // For testing, always auto-refresh
      if (!isSyncing) {
        fetchData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isSyncing, fetchData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect (temporarily disabled for testing)
  }

  const containerVariants = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
  }
  
  const itemVariants = { 
    hidden: { y: 20, opacity: 0 }, 
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-dark via-obsidian-darker to-obsidian-dark">
      <Navigation />
      
      <div className="container px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Revenue Command Center</h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Your data-driven insights to maximize revenue and optimize customer acquisition.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastSynced && (
              <div className="text-sm text-muted-foreground">
                Last synced: {lastSynced.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={syncData}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-foreground glass-card hover:bg-obsidian-card/50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 glass-card border-l-4 border-destructive p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-destructive-foreground">Error: {error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatCard 
            title="Total Revenue" 
            value={kpis?.totalRevenue} 
            icon={<DollarSign className="w-6 h-6" />} 
            isLoading={isLoading} 
            animationVariants={itemVariants} 
            color={['#6366F1', '#818CF8']} 
          />
          <StatCard 
            title="Total Orders" 
            value={kpis?.totalOrders} 
            icon={<ShoppingCart className="w-6 h-6" />} 
            isLoading={isLoading} 
            animationVariants={itemVariants} 
            color={['#3B82F6', '#60A5FA']} 
          />
          <StatCard 
            title="Total Customers" 
            value={kpis?.totalCustomers} 
            icon={<Users className="w-6 h-6" />} 
            isLoading={isLoading} 
            animationVariants={itemVariants} 
            color={['#10B981', '#34D399']} 
          />
        </motion.div>


        {/* Charts and Customer List */}
        <motion.div
          className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <div className="lg:col-span-2">
            <TabbedCharts 
              data={chartData}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              isLoading={isLoading}
              animationVariants={itemVariants}
            />
          </div>
          <div className="lg:col-span-1">
            <TopCustomersList 
              customers={topCustomers} 
              isLoading={isLoading} 
              animationVariants={itemVariants} 
            />
          </div>
        </motion.div>

        {/* All Customers List */}
        <motion.div
          className="mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <CustomerList animationVariants={itemVariants} />
        </motion.div>
      </div>
    </div>
  )
}
