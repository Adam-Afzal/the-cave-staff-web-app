// Deactivates a staff member (revokes portal access, reversible).
// Replaces the (now undeployed) the-cave-ai-api POST /api/staff/{user_id}/deactivate endpoint.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/response.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ detail: 'Method not allowed' }, 405)

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ detail: 'Invalid JSON body' }, 400)
  }

  const { userId } = body
  if (!userId) return json({ detail: 'userId is required' }, 400)

  const { data, error } = await admin
    .from('staff')
    .update({ is_active: false })
    .eq('auth_user_id', userId)
    .select()

  if (error) return json({ detail: error.message }, 500)
  if (!data?.length) return json({ detail: 'Staff member not found' }, 404)

  return json({ success: true, user_id: userId })
})
