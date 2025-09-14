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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyString = Buffer.from(rawBody).toString();

    console.log('Received order creation webhook');

    // Verify HMAC
    if (!verifyShopifyHmac(req, Buffer.from(bodyString))) {
      console.error('Invalid HMAC for order creation webhook');
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(bodyString);
    await handleOrderCreate(payload);

    return NextResponse.json({ success: true, event: 'orders/create' });
  } catch (error) {
    console.error('Order creation webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
