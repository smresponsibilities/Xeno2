import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING', 
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    
    // Show first 20 chars for debugging
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...',
  }

  return NextResponse.json(envCheck)
}
