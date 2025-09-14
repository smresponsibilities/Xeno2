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
    
    // Get system user ID for webhook processing
    const { data: systemUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'system@shopify-insights.local')
      .single();

    if (userError || !systemUser) {
      console.error('System user not found for webhook processing:', userError);
      return;
    }

    const systemUserId = (systemUser as any).id;

    const { error } = await (supabase as any)
      .from('shopify_orders')
      .insert({
        user_id: systemUserId,
        shopify_order_id: order.id,
        shopify_customer_id: order.customer?.id || null,
        email: order.customer?.email || order.email || null,
        order_number: order.order_number || parseInt(order.name?.replace('#', '') || '0'),
        total_price: parseFloat(order.total_price) || 0,
        subtotal_price: parseFloat(order.subtotal_price) || parseFloat(order.total_price) || 0,
        total_tax: parseFloat(order.total_tax) || 0,
        currency: order.currency || 'USD',
        financial_status: order.financial_status || 'unknown',
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        order_status_url: order.order_status_url || null,
        processed_at: order.processed_at || new Date().toISOString(),
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

