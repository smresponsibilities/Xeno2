import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

function verifyShopifyHmac(req: NextRequest, rawBody: Buffer): boolean {
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  if (!hmacHeader || !SHOPIFY_WEBHOOK_SECRET) {
    return false;
  }
  
  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');
  
  return hmacHeader === generatedHmac;
}

// Order handlers
async function handleOrderCreate(order: any) {
  console.log('New Order Created:', {
    id: order.id,
    orderNumber: order.order_number,
    totalPrice: order.total_price,
    currency: order.currency,
    customerId: order.customer?.id,
    createdAt: order.created_at,
    lineItems: order.line_items?.length || 0
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    
    // Get store_id from the webhook (you might need to extract this from the webhook URL or headers)
    const storeId = process.env.SHOPIFY_STORE_ID || 'default-store';
    
    const { error } = await (supabase as any)
      .from('orders')
      .insert({
        shopify_id: order.id.toString(),
        total_price: parseFloat(order.total_price) || 0,
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        processed_at: order.processed_at || new Date().toISOString(),
        customer_id: order.customer?.id?.toString() || '',
        store_id: storeId,
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString()
      });

    if (error) {
      console.error('Error saving order:', error);
    } else {
      console.log('Order saved to database successfully');
    }
  } catch (error) {
    console.error('Error processing order creation:', error);
  }
}

async function handleOrderFulfilled(order: any) {
  console.log('Order Fulfilled:', {
    id: order.id,
    orderNumber: order.order_number,
    fulfillmentStatus: order.fulfillment_status,
    trackingNumber: order.tracking_number,
    fulfilledAt: order.updated_at
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    
    const { error } = await (supabase as any)
      .from('orders')
      .update({
        fulfillment_status: order.fulfillment_status || 'fulfilled',
        updated_at: order.updated_at || new Date().toISOString()
      })
      .eq('shopify_id', order.id.toString());

    if (error) {
      console.error('Error updating order fulfillment:', error);
    } else {
      console.log('Order fulfillment updated in database');
    }
  } catch (error) {
    console.error('Error processing order fulfillment:', error);
  }
}

async function handleOrderCancelled(order: any) {
  console.log('Order Cancelled:', {
    id: order.id,
    orderNumber: order.order_number,
    cancelReason: order.cancel_reason,
    cancelledAt: order.updated_at,
    refundAmount: order.total_price
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    
    const { error } = await (supabase as any)
      .from('orders')
      .update({
        fulfillment_status: 'cancelled',
        updated_at: order.updated_at || new Date().toISOString()
      })
      .eq('shopify_id', order.id.toString());

    if (error) {
      console.error('Error updating order cancellation:', error);
    } else {
      console.log('Order cancellation updated in database');
    }
  } catch (error) {
    console.error('Error processing order cancellation:', error);
  }
}

async function handleOrderUpdate(order: any) {
  console.log('Order Updated:', {
    id: order.id,
    orderNumber: order.order_number,
    financialStatus: order.financial_status,
    fulfillmentStatus: order.fulfillment_status,
    updatedAt: order.updated_at
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    
    const { error } = await (supabase as any)
      .from('orders')
      .update({
        total_price: parseFloat(order.total_price) || 0,
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        updated_at: order.updated_at || new Date().toISOString()
      })
      .eq('shopify_id', order.id.toString());

    if (error) {
      console.error('Error updating order:', error);
    } else {
      console.log('Order updated in database');
    }
  } catch (error) {
    console.error('Error processing order update:', error);
  }
}

// Customer handlers
async function handleCustomerCreate(customer: any) {
  console.log('New Customer Created:', {
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    phone: customer.phone,
    createdAt: customer.created_at,
    totalSpent: customer.total_spent
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    const storeId = process.env.SHOPIFY_STORE_ID || 'default-store';
    
    const { error } = await (supabase as any)
      .from('customers')
      .insert({
        shopify_id: customer.id.toString(),
        email: customer.email || null,
        first_name: customer.first_name || null,
        last_name: customer.last_name || null,
        total_spent: parseFloat(customer.total_spent) || 0,
        orders_count: customer.orders_count || 0,
        store_id: storeId,
        created_at: customer.created_at || new Date().toISOString(),
        updated_at: customer.updated_at || new Date().toISOString()
      });

    if (error) {
      console.error('Error saving customer:', error);
    } else {
      console.log('Customer saved to database successfully');
    }
  } catch (error) {
    console.error('Error processing customer creation:', error);
  }
}

async function handleCustomerUpdate(customer: any) {
  console.log('Customer Updated:', {
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    phone: customer.phone,
    updatedAt: customer.updated_at,
    totalSpent: customer.total_spent
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    
    const { error } = await (supabase as any)
      .from('customers')
      .update({
        email: customer.email || null,
        first_name: customer.first_name || null,
        last_name: customer.last_name || null,
        total_spent: parseFloat(customer.total_spent) || 0,
        orders_count: customer.orders_count || 0,
        updated_at: customer.updated_at || new Date().toISOString()
      })
      .eq('shopify_id', customer.id.toString());

    if (error) {
      console.error('Error updating customer:', error);
    } else {
      console.log('Customer updated in database');
    }
  } catch (error) {
    console.error('Error processing customer update:', error);
  }
}

// Product handlers
async function handleProductCreate(product: any) {
  console.log('New Product Created:', {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.product_type,
    vendor: product.vendor,
    status: product.status,
    createdAt: product.created_at,
    variants: product.variants?.length || 0
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    const storeId = process.env.SHOPIFY_STORE_ID || 'default-store';
    
    const { error } = await (supabase as any)
      .from('products')
      .insert({
        shopify_id: product.id.toString(),
        title: product.title || '',
        vendor: product.vendor || '',
        store_id: storeId,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString()
      });

    if (error) {
      console.error('Error saving product:', error);
    } else {
      console.log('Product saved to database successfully');
    }
  } catch (error) {
    console.error('Error processing product creation:', error);
  }
}

async function handleProductUpdate(product: any) {
  console.log('Product Updated:', {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.product_type,
    vendor: product.vendor,
    status: product.status,
    updatedAt: product.updated_at,
    variants: product.variants?.length || 0
  });
  
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not available');
      return;
    }
    
    const { error } = await (supabase as any)
      .from('products')
      .update({
        title: product.title || '',
        vendor: product.vendor || '',
        updated_at: product.updated_at || new Date().toISOString()
      })
      .eq('shopify_id', product.id.toString());

    if (error) {
      console.error('Error updating product:', error);
    } else {
      console.log('Product updated in database');
    }
  } catch (error) {
    console.error('Error processing product update:', error);
  }
}

// Cart handlers
async function handleCartCreate(cart: any) {
  console.log('New Cart Created:', {
    id: cart.id,
    token: cart.token,
    customerId: cart.customer_id,
    lineItems: cart.line_items?.length || 0,
    totalPrice: cart.total_price,
    currency: cart.currency,
    createdAt: cart.created_at
  });
  
  // Note: Cart table not present in current database schema
  // You may need to create a carts table if you want to store cart data
  console.log('Cart creation logged - no database storage (carts table not found)');
}

async function handleCartUpdate(cart: any) {
  console.log('Cart Updated:', {
    id: cart.id,
    token: cart.token,
    customerId: cart.customer_id,
    lineItems: cart.line_items?.length || 0,
    totalPrice: cart.total_price,
    currency: cart.currency,
    updatedAt: cart.updated_at
  });
  
  // Note: Cart table not present in current database schema
  // You may need to create a carts table if you want to store cart data
  console.log('Cart update logged - no database storage (carts table not found)');
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyString = Buffer.from(rawBody).toString();
    const event = req.headers.get('x-shopify-topic');

    console.log('Received Shopify webhook:', event);

    // Verify HMAC
    if (!verifyShopifyHmac(req, Buffer.from(bodyString))) {
      console.error('Invalid HMAC for webhook:', event);
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(bodyString);

    // Route to appropriate handler based on event type
    switch (event) {
      // Order events
      case 'orders/create':
        await handleOrderCreate(payload);
        break;
      case 'orders/fulfilled':
        await handleOrderFulfilled(payload);
        break;
      case 'orders/cancelled':
        await handleOrderCancelled(payload);
        break;
      case 'orders/updated':
        await handleOrderUpdate(payload);
        break;
      
      // Customer events
      case 'customers/create':
        await handleCustomerCreate(payload);
        break;
      case 'customers/updated':
        await handleCustomerUpdate(payload);
        break;
      
      // Product events
      case 'products/create':
        await handleProductCreate(payload);
        break;
      case 'products/update':
        await handleProductUpdate(payload);
        break;
      
      // Cart events
      case 'carts/create':
        await handleCartCreate(payload);
        break;
      case 'carts/update':
        await handleCartUpdate(payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
        return NextResponse.json({ message: 'Event not handled' }, { status: 200 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-shopify-topic, x-shopify-hmac-sha256',
    },
  });
}
