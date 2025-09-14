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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyString = Buffer.from(rawBody).toString();

    console.log('Received product creation webhook');

    // Verify HMAC
    if (!verifyShopifyHmac(req, Buffer.from(bodyString))) {
      console.error('Invalid HMAC for product creation webhook');
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(bodyString);
    await handleProductCreate(payload);

    return NextResponse.json({ success: true, event: 'products/create' });
  } catch (error) {
    console.error('Product creation webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
