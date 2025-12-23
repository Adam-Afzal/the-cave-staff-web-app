import { createClient } from '@supabase/supabase-js'

const supabaseUrl = ""
const supabaseServiceKey = ""

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'youssof@righteousnrich.com',
    password: 'community@123',
    email_confirm: true
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    return
  }

  console.log('✓ Auth user created:', authData.user.id)

  // Create staff record
  const { error: staffError } = await supabase.from('staff').insert({
    auth_user_id: authData.user.id,
    first_name: 'Youssef',
    last_name: 'Radwan',
    email: 'youssof@righteousnrich.com',
    role: 'Community Manager',
    department: 'Customer Service'
  })

  if (staffError) {
    console.error('Error creating staff record:', staffError)
    return
  }

  console.log('✓ Staff record created')
  console.log('\nYou can now login with:')
  console.log('Email: youssof@righteousnrich.com')
  console.log('Password: community@123')
}

createUser()