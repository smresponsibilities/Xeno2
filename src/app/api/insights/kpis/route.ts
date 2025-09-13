import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { shopifyService } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Admin client not available')
    }

    // First try to get data from Supabase (cached/processed data)
    const { data: revenueData } = await supabaseAdmin
      .from('shopify_orders')
      .select('total_price')

    // If no data in Supabase, fetch directly from Shopify
    if (!revenueData || revenueData.length === 0) {
      console.log('No data in database, fetching from Shopify API...')
      
      const [customers, orders] = await Promise.all([
        shopifyService.getCustomers(),
        shopifyService.getOrders()
      ])

      // Calculate KPIs from Shopify data
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (parseFloat(order.total_price || '0') || 0), 0)
      const totalOrders = orders.length
      const totalCustomers = customers.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      return NextResponse.json({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: totalOrders,
        totalCustomers: totalCustomers,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        source: 'shopify-api'
      })
    }

    // Use Supabase data if available
    const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + (parseFloat(order.total_price) || 0), 0) || 0

    // Get total orders count
    const { count: totalOrders } = await supabaseAdmin
      .from('shopify_orders')
      .select('*', { count: 'exact', head: true })

    // Get total customers count
    const { count: totalCustomers } = await supabaseAdmin
      .from('shopify_customers')
      .select('*', { count: 'exact', head: true })

    // Calculate average order value
    const ordersCount = totalOrders || 0
    const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: ordersCount,
      totalCustomers: totalCustomers || 0,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      source: 'database'
    })

  } catch (error: any) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}
