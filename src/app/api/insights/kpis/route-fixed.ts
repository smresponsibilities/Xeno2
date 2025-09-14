import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get total revenue
    const { data: revenueData } = await supabaseAdmin
      .from('shopify_orders')
      .select('total_price')

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
    })

  } catch (error: any) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}
