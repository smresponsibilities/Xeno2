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

    console.log('Received cart update webhook');

    // Verify HMAC
    if (!verifyShopifyHmac(req, Buffer.from(bodyString))) {
      console.error('Invalid HMAC for cart update webhook');
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(bodyString);
    await handleCartUpdate(payload);

    return NextResponse.json({ success: true, event: 'carts/update' });
  } catch (error) {
    console.error('Cart update webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}





