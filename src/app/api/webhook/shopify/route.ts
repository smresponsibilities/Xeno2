import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
  
  // TODO: Add logic to process new order
  // - Store order in database
  // - Update analytics
  // - Send notifications
  // - Update inventory
}

async function handleOrderFulfilled(order: any) {
  console.log('Order Fulfilled:', {
    id: order.id,
    orderNumber: order.order_number,
    fulfillmentStatus: order.fulfillment_status,
    trackingNumber: order.tracking_number,
    fulfilledAt: order.updated_at
  });
  
  // TODO: Add logic to process order fulfillment
  // - Update order status in database
  // - Send tracking information to customer
  // - Update inventory levels
  // - Trigger fulfillment notifications
}

async function handleOrderCancelled(order: any) {
  console.log('Order Cancelled:', {
    id: order.id,
    orderNumber: order.order_number,
    cancelReason: order.cancel_reason,
    cancelledAt: order.updated_at,
    refundAmount: order.total_price
  });
  
  // TODO: Add logic to process order cancellation
  // - Update order status in database
  // - Process refunds
  // - Restore inventory
  // - Send cancellation notifications
}

async function handleOrderUpdate(order: any) {
  console.log('Order Updated:', {
    id: order.id,
    orderNumber: order.order_number,
    financialStatus: order.financial_status,
    fulfillmentStatus: order.fulfillment_status,
    updatedAt: order.updated_at
  });
  
  // TODO: Add logic to process order update
  // - Update order in database
  // - Handle status changes
  // - Trigger appropriate workflows
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
  
  // TODO: Add logic to process new customer
  // - Store customer in database
  // - Add to marketing lists
  // - Send welcome email
  // - Update customer analytics
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
  
  // TODO: Add logic to process customer update
  // - Update customer in database
  // - Sync changes across systems
  // - Update customer segments
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
  
  // TODO: Add logic to process new product
  // - Store product in database
  // - Update product catalog
  // - Sync with external systems
  // - Update search indexes
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
  
  // TODO: Add logic to process product update
  // - Update product in database
  // - Sync changes across systems
  // - Update search indexes
  // - Handle inventory changes
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
  
  // TODO: Add logic to process new cart
  // - Store cart in database
  // - Track cart abandonment
  // - Trigger cart recovery campaigns
  // - Update analytics
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
  
  // TODO: Add logic to process cart update
  // - Update cart in database
  // - Track cart changes
  // - Update recommendations
  // - Trigger cart recovery if needed
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
        await handleOrderCancellation(payload);
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
