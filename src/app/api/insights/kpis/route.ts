import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { shopifyService } from '@/lib/shopify'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Admin client not available')
    }

    // Get system user ID for filtering webhook data
    const { data: systemUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'system@shopify-insights.local')
      .single()

    const systemUserId = (systemUser as any)?.id

    // First try to get data from Supabase (cached/processed data) filtered by system user
    const { data: revenueData } = await supabaseAdmin
      .from('shopify_orders')
      .select('total_price')
      .eq('user_id', systemUserId)

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
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Use Supabase data if available
    const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + (parseFloat(order.total_price) || 0), 0) || 0

    // Get total orders count filtered by system user
    const { count: totalOrders } = await supabaseAdmin
      .from('shopify_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', systemUserId)

    // Get total customers count filtered by system user
    const { count: totalCustomers } = await supabaseAdmin
      .from('shopify_customers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', systemUserId)

    // Calculate average order value
    const ordersCount = totalOrders || 0
    const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: ordersCount,
      totalCustomers: totalCustomers || 0,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      source: 'database'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}
