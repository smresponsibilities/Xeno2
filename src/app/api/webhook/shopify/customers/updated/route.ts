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
      .from('shopify_customers')
      .update({
        email: customer.email || null,
        first_name: customer.first_name || null,
        last_name: customer.last_name || null,
        total_spent: parseFloat(customer.total_spent) || 0,
        orders_count: customer.orders_count || 0,
        updated_at: customer.updated_at || new Date().toISOString()
      })
      .eq('user_id', systemUserId)
      .eq('shopify_customer_id', customer.id);

    if (error) {
      console.error('Error updating customer:', error);
    } else {
      console.log('Customer updated in database');
    }
  } catch (error) {
    console.error('Error processing customer update:', error);
  }
  
  // Trigger dashboard refresh
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/refresh-dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'customers/updated',
        data: { customerId: customer.id }
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

    console.log('Received customer update webhook');

    // Verify HMAC
    if (!verifyShopifyHmac(req, Buffer.from(bodyString))) {
      console.error('Invalid HMAC for customer update webhook');
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(bodyString);
    await handleCustomerUpdate(payload);

    return NextResponse.json({ success: true, event: 'customers/updated' });
  } catch (error) {
    console.error('Customer update webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

