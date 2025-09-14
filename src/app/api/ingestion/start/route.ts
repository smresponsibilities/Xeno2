import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { shopifyService } from '@/lib/shopify'

export async function POST() {
  try {
    console.log('Starting data ingestion...')
    
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Admin client not available')
    }

    // Get or create system user for data ingestion
    let systemUserId: string
    try {
      // Try to find existing system user
      const { data: existingUser, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', 'system@shopify-insights.local')
        .single()

      if (findError && findError.code !== 'PGRST116') {
        throw findError
      }

      if (existingUser && (existingUser as any).id) {
        systemUserId = (existingUser as any).id
        console.log('Using existing system user:', systemUserId)
      } else {
        // Create system user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: 'system@shopify-insights.local',
          password: 'system-password-' + Date.now(),
          email_confirm: true
        })

        if (createError) {
          throw createError
        }

        systemUserId = newUser.user.id
        console.log('Created system user:', systemUserId)
      }
    } catch (error: unknown) {
      console.error('Error setting up system user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error('Failed to setup system user: ' + errorMessage)
    }

    const totalIngested = {
      customers: 0,
      orders: 0,
      products: 0
    }

    // 1. Ingest Customers
    console.log('Fetching customers from Shopify...')
    const customers = await shopifyService.getCustomers()
    console.log(`Found ${customers.length} customers`)

    if (customers.length > 0) {
      // Transform customers for database
      const customerData = customers.map(customer => {
        // Extract name from addresses if available, or use fallback
        const defaultAddress = customer.default_address || customer.addresses?.[0]
        let firstName = 'Customer'
        let lastName = `#${customer.id.toString().slice(-4)}`
        
        // Try to get names from address
        if (defaultAddress?.first_name && defaultAddress?.last_name) {
          firstName = defaultAddress.first_name
          lastName = defaultAddress.last_name
        } else if (defaultAddress?.company) {
          // Use company name as last name if no personal names available
          firstName = 'Customer'
          lastName = defaultAddress.company
        }
        
        const email = customer.email || null
        
        console.log('Processing customer:', {
          id: customer.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          total_spent: customer.total_spent,
          orders_count: customer.orders_count,
          has_address: !!defaultAddress,
          company: defaultAddress?.company
        })
        
        return {
          user_id: systemUserId,
          shopify_customer_id: customer.id.toString(),
          first_name: firstName,
          last_name: lastName, 
          email: email,
          total_spent: parseFloat(customer.total_spent || '0'),
          orders_count: customer.orders_count || 0,
          created_at: customer.created_at,
          updated_at: customer.updated_at
        }
      })

      // Upsert customers (update if exists, insert if new)
      const { data: insertedCustomers, error: customerError } = await supabaseAdmin
        .from('shopify_customers')
        .upsert(customerData as any, { 
          onConflict: 'user_id,shopify_customer_id',
          ignoreDuplicates: false 
        })
        .select()

      if (customerError) {
        console.error('Customer insertion error:', customerError)
        throw new Error(`Failed to insert customers: ${customerError.message}`)
      } else {
        totalIngested.customers = insertedCustomers?.length || 0
        console.log(`Successfully ingested ${totalIngested.customers} customers`)
      }
    }

    // 2. Ingest Orders
    console.log('Fetching orders from Shopify...')
    const orders = await shopifyService.getOrders()
    console.log(`Found ${orders.length} orders`)

    if (orders.length > 0) {
      // Transform orders for database
      const orderData = orders.map(order => ({
        user_id: systemUserId,
        shopify_order_id: order.id.toString(),
        shopify_customer_id: order.customer?.id || null,
        email: null, // Will be populated from customer data if needed
        order_number: order.order_number || parseInt(order.name?.replace('#', '') || '0'),
        total_price: parseFloat(order.total_price || '0'),
        subtotal_price: parseFloat(order.total_price || '0'), // Using total_price as subtotal for now
        total_tax: 0, // Not available in current API response
        currency: order.currency || 'USD',
        financial_status: order.financial_status || 'unknown',
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        order_status_url: null, // Not available in current API response
        processed_at: order.processed_at,
        created_at: order.created_at,
        updated_at: order.updated_at
      }))

      // Upsert orders
      const { data: insertedOrders, error: orderError } = await supabaseAdmin
        .from('shopify_orders')
        .upsert(orderData as any, { 
          onConflict: 'user_id,shopify_order_id',
          ignoreDuplicates: false 
        })
        .select()

      if (orderError) {
        console.error('Order insertion error:', orderError)
        throw new Error(`Failed to insert orders: ${orderError.message}`)
      } else {
        totalIngested.orders = insertedOrders?.length || 0
        console.log(`Successfully ingested ${totalIngested.orders} orders`)
      }
    }

    // 3. Ingest Products (basic info)
    console.log('Fetching products from Shopify...')
    const products = await shopifyService.getProducts()
    console.log(`Found ${products.length} products`)

    if (products.length > 0) {
      // Transform products for database
      const productData = products.map(product => ({
        user_id: systemUserId,
        shopify_product_id: product.id.toString(),
        title: product.title || 'Untitled Product',
        handle: product.handle || '',
        product_type: product.product_type || '',
        vendor: product.vendor || '',
        status: product.status || 'draft',
        created_at: product.created_at,
        updated_at: product.updated_at
      }))

      // Note: You'll need to create a shopify_products table if it doesn't exist
      try {
        const { data: insertedProducts, error: productError } = await supabaseAdmin
          .from('shopify_products')
          .upsert(productData as any, { 
            onConflict: 'user_id,shopify_product_id',
            ignoreDuplicates: false 
          })
          .select()

        if (productError) {
          console.error('Product insertion error:', productError)
          throw new Error(`Failed to insert products: ${productError.message}`)
        } else {
          totalIngested.products = insertedProducts?.length || 0
          console.log(`Successfully ingested ${totalIngested.products} products`)
        }
      } catch {
        console.log('Products table may not exist - skipping product ingestion')
      }
    }
    
    const response = {
      success: true,
      message: 'Data ingestion completed successfully',
      summary: totalIngested,
      timestamp: new Date().toISOString()
    }

    console.log('Ingestion complete:', response)
    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('Data ingestion failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        success: false,
        error: 'Data ingestion failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
