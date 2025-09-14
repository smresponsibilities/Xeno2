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
      .update({
        total_price: parseFloat(order.total_price) || 0,
        subtotal_price: parseFloat(order.subtotal_price) || parseFloat(order.total_price) || 0,
        total_tax: parseFloat(order.total_tax) || 0,
        financial_status: order.financial_status || 'unknown',
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        updated_at: order.updated_at || new Date().toISOString()
      })
      .eq('user_id', systemUserId)
      .eq('shopify_order_id', order.id);

    if (error) {
      console.error('Error updating order:', error);
    } else {
      console.log('Order updated in database');
      
      // Update customer total_spent if customer exists
      if (order.customer?.id) {
        try {
          // Calculate cumulative total from all orders for this customer
          const { data: allOrders } = await supabase
            .from('shopify_orders')
            .select('total_price')
            .eq('user_id', systemUserId)
            .eq('shopify_customer_id', order.customer.id);

          // Calculate total spent from all orders
          const cumulativeTotal = allOrders?.reduce((sum, order) => {
            const orderData = order as { total_price: string | null };
            return sum + parseFloat(orderData.total_price || '0');
          }, 0) || 0;

          // Count total orders for this customer
          const totalOrdersCount = (allOrders?.length || 0);

          // Update customer with cumulative totals
          await (supabase as any)
            .from('shopify_customers')
            .update({
              total_spent: cumulativeTotal,
              orders_count: totalOrdersCount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', systemUserId)
            .eq('shopify_customer_id', order.customer.id);

          console.log('Updated customer with cumulative totals after order update:', {
            customerId: order.customer.id,
            cumulativeTotal,
            totalOrdersCount,
            orderCount: allOrders?.length || 0
          });
        } catch (customerUpdateError) {
          console.error('Error updating customer total_spent:', customerUpdateError);
        }
      }
    }
  } catch (error) {
    console.error('Error processing order update:', error);
  }
  
  // Trigger dashboard refresh
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/refresh-dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'orders/updated',
        data: { orderId: order.id, customerId: order.customer?.id }
      })
    });
  } catch (refreshError) {
    console.error('Error triggering dashboard refresh:', refreshError);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyString = Buffer.from(rawBody).toString();

    console.log('Received order update webhook');

    // Verify HMAC
    if (!verifyShopifyHmac(req, Buffer.from(bodyString))) {
      console.error('Invalid HMAC for order update webhook');
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(bodyString);
    await handleOrderUpdate(payload);

    return NextResponse.json({ success: true, event: 'orders/updated' });
  } catch (error) {
    console.error('Order update webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

