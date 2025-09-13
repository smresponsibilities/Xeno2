import { NextRequest, NextResponse } from 'next/server'
import { shopifyService } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const demo = searchParams.get('demo') === 'true'
    
    let customers
    
    // Demo mode - show how it would look with real customer names
    if (demo) {
      const demoCustomers = [
        {
          id: 1001,
          first_name: 'Alexandra',
          last_name: 'Martinez',
          email: 'alexandra.martinez@example.com',
          total_spent: '12500.75',
          orders_count: 8,
          created_at: '2025-07-15T10:30:00Z',
          updated_at: '2025-09-10T14:20:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        },
        {
          id: 1002,
          first_name: 'James',
          last_name: 'Thompson',
          email: 'james.thompson@example.com',
          total_spent: '8750.25',
          orders_count: 5,
          created_at: '2025-08-20T09:15:00Z',
          updated_at: '2025-09-12T16:45:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        },
        {
          id: 1003,
          first_name: 'Priya',
          last_name: 'Patel',
          email: 'priya.patel@example.com',
          total_spent: '15200.50',
          orders_count: 12,
          created_at: '2025-08-25T11:20:00Z',
          updated_at: '2025-09-08T13:30:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        },
        {
          id: 1004,
          first_name: 'Marcus',
          last_name: 'Anderson',
          email: 'marcus.anderson@example.com',
          total_spent: '3200.00',
          orders_count: 2,
          created_at: '2025-09-01T08:45:00Z',
          updated_at: '2025-09-13T12:15:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        },
        {
          id: 1005,
          first_name: 'Isabella',
          last_name: 'Garcia',
          email: 'isabella.garcia@example.com',
          total_spent: '9800.90',
          orders_count: 6,
          created_at: '2025-09-05T15:30:00Z',
          updated_at: '2025-09-11T10:20:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        },
        {
          id: 1006,
          first_name: 'David',
          last_name: 'Kim',
          email: 'david.kim@example.com',
          total_spent: '4500.30',
          orders_count: 3,
          created_at: '2025-09-08T12:15:00Z',
          updated_at: '2025-09-14T09:45:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        },
        {
          id: 1007,
          first_name: 'Sarah',
          last_name: 'Williams',
          email: 'sarah.williams@example.com',
          total_spent: '18900.15',
          orders_count: 15,
          created_at: '2025-08-10T14:20:00Z',
          updated_at: '2025-09-13T16:30:00Z',
          state: 'enabled',
          verified_email: true,
          addresses: [],
          default_address: undefined
        }
      ]
      
      customers = search && search.trim() 
        ? demoCustomers.filter(c => 
            c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
          )
        : demoCustomers
    } else {
      if (search && search.trim()) {
        // Search customers by name
        customers = await shopifyService.searchCustomers(search.trim())
      } else {
        // Get all customers
        customers = await shopifyService.getCustomers()
      }
    }
    
    // Transform customers to include proper names with enhanced logic
    const customersWithNames = customers.map(customer => {
      // Use the centralized method from Shopify service
      const fullName = shopifyService.getCustomerDisplayName(customer)
      
      // Determine display type based on available data
      let displayType = 'unknown'
      if (customer.first_name && customer.last_name) {
        displayType = 'personal'
      } else if (customer.first_name || customer.last_name) {
        displayType = 'partial_personal'
      } else if (customer.email) {
        displayType = 'email_based'
      } else if (customer.default_address?.company) {
        displayType = 'company'
      } else {
        displayType = 'id_fallback'
      }
      
      return {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        full_name: fullName,
        total_spent: customer.total_spent,
        orders_count: customer.orders_count,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        state: customer.state,
        verified_email: customer.verified_email,
        has_address: !!(customer.default_address || (customer.addresses && customer.addresses.length > 0)),
        company: customer.default_address?.company || customer.addresses?.[0]?.company || null,
        display_type: displayType, // Track how we determined the name
        pii_available: !!(customer.first_name || customer.last_name || customer.email) // Track PII availability
      }
    })
    
    console.log(`Found ${customersWithNames.length} customers${search ? ` matching "${search}"` : ''}`)
    
    return NextResponse.json({
      customers: customersWithNames,
      total: customersWithNames.length,
      search: search || null
    })
    
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers', details: error.message },
      { status: 500 }
    )
  }
}
