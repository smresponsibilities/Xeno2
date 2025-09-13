import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return Response.json({ 
        success: false, 
        error: error.message,
        hint: 'Make sure you have run the supabase-setup.sql script in your Supabase SQL editor'
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data 
    })
  } catch (error: any) {
    console.error('Test error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
