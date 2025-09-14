import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Admin client not available')
    }

    // Test if we can connect to Supabase and list tables
    const { data, error } = await supabaseAdmin
      .rpc('get_tables')
      .single()

    if (error) {
      console.log('RPC error:', error)
      
      // Try a simple query to see what tables exist
      const { data: tablesData, error: tablesError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (tablesError) {
        console.log('Tables query error:', tablesError)
        
        // Last resort - try any simple query
        const { error: simpleError } = await supabaseAdmin
          .from('auth.users')
          .select('count')
          .limit(1)
          
        return NextResponse.json({
          status: 'Database connected but schema issues',
          simpleError: simpleError?.message,
          recommendation: 'Run the SQL setup script in Supabase SQL Editor'
        })
      }

      return NextResponse.json({
        status: 'Connected - showing available tables',
        tables: tablesData,
        error: error.message
      })
    }

    return NextResponse.json({
      status: 'Success',
      data
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'Connection failed',
      error: error.message,
      recommendation: 'Check Supabase credentials'
    })
  }
}
