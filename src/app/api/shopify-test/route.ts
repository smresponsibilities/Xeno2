import { NextResponse } from 'next/server'
import { shopifyService } from '@/lib/shopify'

export async function GET() {
  try {
    console.log('Testing Shopify API connection...')
    
    // Test basic connection
    const shopInfo = await shopifyService.testConnection()
    console.log('Shop info:', shopInfo)
    
    // Test data fetching
    const [customers, products, orders] = await Promise.all([
      shopifyService.getCustomers(),
      shopifyService.getProducts(), 
      shopifyService.getOrders()
    ])
    
    console.log(`Fetched: ${customers.length} customers, ${products.length} products, ${orders.length} orders`)
    
    return NextResponse.json({
      success: true,
      message: 'Shopify API connection successful',
      shop: shopInfo.shop,
      data: {
        customers: {
          count: customers.length,
          sample: customers.slice(0, 2) // First 2 customers for preview
        },
        products: {
          count: products.length,
          sample: products.slice(0, 2) // First 2 products for preview
        },
        orders: {
          count: orders.length,
          sample: orders.slice(0, 2) // First 2 orders for preview
        }
      }
    })
    
  } catch (error: any) {
    console.error('Shopify API test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
