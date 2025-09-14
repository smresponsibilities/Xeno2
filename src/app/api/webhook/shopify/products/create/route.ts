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
    // const storeId = process.env.SHOPIFY_STORE_ID || 'default-store';
    
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
      .from('shopify_products')
      .insert({
        user_id: systemUserId,
        shopify_product_id: product.id,
        title: product.title || '',
        vendor: product.vendor || '',
        product_type: product.product_type || '',
        handle: product.handle || '',
        status: product.status || 'active',
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

