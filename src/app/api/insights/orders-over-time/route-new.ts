import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDateQuery = searchParams.get('startDate')
    const endDateQuery = searchParams.get('endDate')

    let startDate: string
    let endDate: string

    if (startDateQuery) {
      startDate = new Date(startDateQuery).toISOString()
    } else {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      startDate = date.toISOString()
    }

    if (endDateQuery) {
      endDate = new Date(endDateQuery).toISOString()
    } else {
      endDate = new Date().toISOString()
    }

    // Get orders data
    const { data: ordersData } = await supabaseAdmin
      .from('shopify_orders')
      .select('created_at, total_price')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at')

    // Group by date on the client side
    const groupedData: { [key: string]: { count: number, revenue: number } } = {}
    
    ordersData?.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!groupedData[date]) {
        groupedData[date] = { count: 0, revenue: 0 }
      }
      groupedData[date].count += 1
      groupedData[date].revenue += parseFloat(order.total_price) || 0
    })

    const formattedData = Object.entries(groupedData).map(([date, data]) => ({
      date,
      orders: data.count,
      revenue: Math.round(data.revenue * 100) / 100
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(formattedData)

  } catch (error: any) {
    console.error('Error fetching orders over time:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders over time' },
      { status: 500 }
    )
  }
}
