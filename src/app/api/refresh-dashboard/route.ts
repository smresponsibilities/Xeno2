import { NextRequest, NextResponse } from 'next/server'

// Store the last refresh timestamp in memory (in production, use Redis or database)
let lastRefreshTimestamp: string | null = null

// This endpoint can be called by webhooks to trigger dashboard refresh
// It will be used to notify the dashboard that data has been updated
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    // Update the last refresh timestamp
    lastRefreshTimestamp = new Date().toISOString()

    console.log('Dashboard refresh triggered by webhook:', event)

    // Log the refresh event for debugging
    console.log('Refresh event details:', {
      event,
      timestamp: lastRefreshTimestamp,
      data: data ? 'Data included' : 'No data'
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Dashboard refresh triggered',
      event,
      timestamp: lastRefreshTimestamp
    })

  } catch (error: any) {
    console.error('Error in refresh endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to trigger refresh' },
      { status: 500 }
    )
  }
}

// Allow GET to check last refresh timestamp
export async function GET() {
  return NextResponse.json({
    message: 'Dashboard refresh endpoint is active',
    timestamp: lastRefreshTimestamp || new Date().toISOString(),
    hasRecentRefresh: lastRefreshTimestamp ? 
      (new Date().getTime() - new Date(lastRefreshTimestamp).getTime()) < 10000 : false
  })
}
