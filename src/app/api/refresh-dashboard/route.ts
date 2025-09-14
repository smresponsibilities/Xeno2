import { NextRequest, NextResponse } from 'next/server'

// Store the last refresh timestamp in memory (in production, use Redis or database)
let lastRefreshTimestamp: string | null = null

// Store active SSE connections for real-time notifications
const activeConnections = new Set<ReadableStreamDefaultController>()

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

    // Notify all active SSE connections
    const message = JSON.stringify({
      type: 'refresh',
      event,
      timestamp: lastRefreshTimestamp,
      data
    })

    // Send message to all active connections
    activeConnections.forEach(controller => {
      try {
        controller.enqueue(`data: ${message}\n\n`)
      } catch (error) {
        console.error('Error sending SSE message:', error)
        // Remove dead connections
        activeConnections.delete(controller)
      }
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Dashboard refresh triggered',
      event,
      timestamp: lastRefreshTimestamp,
      activeConnections: activeConnections.size
    })

  } catch (error: any) {
    console.error('Error in refresh endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to trigger refresh' },
      { status: 500 }
    )
  }
}

// SSE endpoint for real-time webhook notifications
export async function GET() {
  let controllerRef: ReadableStreamDefaultController | null = null
  
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      
      // Add this connection to active connections
      activeConnections.add(controller)
      
      // Send initial connection message
      const welcomeMessage = JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to webhook notifications'
      })
      controller.enqueue(`data: ${welcomeMessage}\n\n`)

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })
          controller.enqueue(`data: ${heartbeatMessage}\n\n`)
        } catch (err) {
          console.error('Heartbeat error:', err)
          clearInterval(heartbeat)
          activeConnections.delete(controller)
        }
      }, 30000)

      // Clean up on connection close
      const cleanup = () => {
        clearInterval(heartbeat)
        activeConnections.delete(controller)
        console.log('SSE connection closed, active connections:', activeConnections.size)
      }

      // Store cleanup function for later use
      ;(controller as any).cleanup = cleanup
    },
    cancel() {
      // Connection was cancelled
      if (controllerRef) {
        activeConnections.delete(controllerRef)
        console.log('SSE connection cancelled, active connections:', activeConnections.size)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}
