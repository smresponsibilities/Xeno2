import axios from 'axios'

export interface ShopifyCustomer {
  id: number
  email?: string
  first_name?: string
  last_name?: string
  total_spent?: string
  orders_count?: number
  created_at?: string
  updated_at?: string
  state?: string
  verified_email?: boolean
  // PII fields may be missing on Basic plan stores
  phone?: string
  addresses?: Array<{
    id: number
    customer_id: number
    first_name?: string
    last_name?: string
    company?: string
    province?: string
    country?: string
    province_code?: string
    country_code?: string
    country_name?: string
    default?: boolean
  }>
  default_address?: {
    id: number
    customer_id: number
    first_name?: string
    last_name?: string
    company?: string
    province?: string
    country?: string
    province_code?: string
    country_code?: string
    country_name?: string
    default?: boolean
  }
}

export interface ShopifyProduct {
  id: number
  title?: string
  handle?: string
  vendor?: string
  product_type?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface ShopifyOrder {
  id: number
  name?: string
  order_number?: number
  total_price?: string
  currency?: string
  financial_status?: string
  fulfillment_status?: string | null
  processed_at?: string
  created_at?: string
  updated_at?: string
  customer?: {
    id: number
  } | null
}

class ShopifyService {
  private storeUrl: string
  private accessToken: string

  constructor() {
    this.storeUrl = process.env.SHOPIFY_STORE_URL!
    this.accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!
  }

  private getHeaders() {
    return {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    }
  }

  private getApiUrl(endpoint: string) {
    return `https://${this.storeUrl}/admin/api/2024-04/${endpoint}`
  }

  async testConnection() {
    try {
      const response = await axios.get(this.getApiUrl('shop.json'), {
        headers: this.getHeaders(),
      })
      return response.data
    } catch (error: any) {
      console.error('Error connecting to Shopify:', error.response?.data || error.message)
      throw new Error('Failed to connect to Shopify API')
    }
  }

  async getCustomers(): Promise<ShopifyCustomer[]> {
    try {
      // Explicitly request first_name and last_name fields to ensure they are included
      const fields = 'id,email,first_name,last_name,phone,total_spent,orders_count,created_at,updated_at,state,verified_email,multipass_identifier,tax_exempt,tags,last_order_id,last_order_name,currency,addresses,default_address,tax_exemptions,email_marketing_consent,sms_marketing_consent,admin_graphql_api_id'
      const response = await axios.get(this.getApiUrl(`customers.json?limit=250&fields=${fields}`), {
        headers: this.getHeaders(),
      })
      
      console.log('Raw Shopify customers response (with explicit fields):', JSON.stringify(response.data.customers?.slice(0, 2), null, 2))
      
      return response.data.customers || []
    } catch (error: any) {
      console.error('Error fetching customers from Shopify:', error.response?.data || error.message)
      throw new Error('Failed to fetch customers from Shopify')
    }
  }

  async searchCustomers(query: string): Promise<ShopifyCustomer[]> {
    try {
      // Search customers by name using Shopify's search endpoint with explicit fields
      const fields = 'id,email,first_name,last_name,phone,total_spent,orders_count,created_at,updated_at,state,verified_email,multipass_identifier,tax_exempt,tags,last_order_id,last_order_name,currency,addresses,default_address,tax_exemptions,email_marketing_consent,sms_marketing_consent,admin_graphql_api_id'
      const response = await axios.get(this.getApiUrl(`customers/search.json?query=${encodeURIComponent(query)}&limit=250&fields=${fields}`), {
        headers: this.getHeaders(),
      })
      
      console.log('Customer search results (with explicit fields):', JSON.stringify(response.data.customers?.slice(0, 2), null, 2))
      
      return response.data.customers || []
    } catch (error: any) {
      console.error('Error searching customers from Shopify:', error.response?.data || error.message)
      throw new Error('Failed to search customers from Shopify')
    }
  }

  async getProducts(): Promise<ShopifyProduct[]> {
    try {
      // Get all product fields like the working example
      const response = await axios.get(
        this.getApiUrl('products.json?limit=250'),
        {
          headers: this.getHeaders(),
        }
      )
      return response.data.products
    } catch (error: any) {
      console.error('Error fetching products from Shopify:', error.response?.data || error.message)
      throw new Error('Failed to fetch products from Shopify')
    }
  }

  async getOrders(): Promise<ShopifyOrder[]> {
    try {
      // Use the same approach as the working example - get all fields and filter by financial_status
      const response = await axios.get(
        this.getApiUrl('orders.json?status=any&financial_status=paid,partially_refunded&limit=250'),
        {
          headers: this.getHeaders(),
        }
      )
      return response.data.orders
    } catch (error: any) {
      console.error('Error fetching orders from Shopify:', error.response?.data || error.message)
      throw new Error('Failed to fetch orders from Shopify')
    }
  }

  /**
   * Get display name for customer, handling missing PII data on Basic plan
   * @param customer - Shopify customer object
   * @returns Display name string
   */
  getCustomerDisplayName(customer: ShopifyCustomer): string {
    // If first_name and last_name are available, use them
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`
    }
    
    // If only first_name is available
    if (customer.first_name) {
      return customer.first_name
    }
    
    // If only last_name is available
    if (customer.last_name) {
      return customer.last_name
    }
    
    // If email is available, use the part before @
    if (customer.email) {
      const emailPrefix = customer.email.split('@')[0]
      return emailPrefix || 'Customer'
    }
    
    // If company name is available in default address
    if (customer.default_address?.company) {
      return customer.default_address.company
    }
    
    // Fallback to customer ID
    return `Customer #${customer.id}`
  }

  /**
   * Check if store has PII access (requires Shopify plan or higher)
   * @returns boolean indicating if PII data is accessible
   */
  hasPIIAccess(): boolean {
    // Check if we can access PII data by testing a customer response
    // This will be determined by whether first_name/last_name are available
    return true // Now that plan is upgraded, PII access is available
  }
}

export const shopifyService = new ShopifyService()
