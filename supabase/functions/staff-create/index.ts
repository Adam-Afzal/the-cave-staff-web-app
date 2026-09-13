// Creates a staff Auth user + staff record.
// Replaces the (now undeployed) the-cave-ai-api POST /api/staff/create endpoint.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/response.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ detail: 'Method not allowed' }, 405)

  let body: { email?: string; password?: string; firstName?: string; lastName?: string }
  try {
    body = await req.json()
  } catch {
    return json({ detail: 'Invalid JSON body' }, 400)
  }

  const { email, password, firstName, lastName } = body

  if (!email || !password || !firstName || !lastName) {
    return json({ detail: 'All fields are required' }, 400)
  }
  if (password.length < 8) {
    return json({ detail: 'Password must be at least 8 characters' }, 400)
  }

  const { data: userResult, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  })

  if (userError || !userResult.user) {
    const message = userError?.message ?? 'Failed to create user'
    const detail = message.toLowerCase().includes('already been registered')
      ? 'Email already registered'
      : message
    return json({ detail }, 400)
  }

  const { data: staffRows, error: staffError } = await admin
    .from('staff')
    .insert({
      auth_user_id: userResult.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      onboarding_completed: false,
    })
    .select()

  if (staffError || !staffRows?.length) {
    // Roll back the auth user so we don't leave an orphaned login.
    await admin.auth.admin.deleteUser(userResult.user.id)
    return json({ detail: staffError?.message ?? 'Failed to create staff record' }, 400)
  }

  return json({
    success: true,
    user_id: userResult.user.id,
    staff_id: staffRows[0].id,
    email: userResult.user.email,
  })
})
