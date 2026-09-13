// Resets a staff member's password.
// Replaces the (now undeployed) the-cave-ai-api POST /api/staff/{user_id}/reset-password endpoint.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/response.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ detail: 'Method not allowed' }, 405)

  let body: { userId?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return json({ detail: 'Invalid JSON body' }, 400)
  }

  const { userId, password } = body

  if (!userId || !password) {
    return json({ detail: 'userId and password are required' }, 400)
  }
  if (password.length < 8) {
    return json({ detail: 'Password must be at least 8 characters' }, 400)
  }

  const { data, error } = await admin.auth.admin.updateUserById(userId, { password })

  if (error || !data.user) {
    return json({ detail: error?.message ?? 'User not found' }, 404)
  }

  return json({ success: true, user_id: data.user.id })
})
