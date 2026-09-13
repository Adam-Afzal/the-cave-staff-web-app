// Permanently deletes a staff member's record and login. Irreversible,
// so restricted to ADMIN — this is the one staff-admin function that
// verifies caller identity and role, matching ADR 0001 in the old
// the-cave-ai-api backend (ported here since that server is no longer
// deployed).
//
// Deleting the staff row means any assigned_staff_id/created_by_staff_id/
// added_by_staff_id referencing it will resolve to no staff record
// afterward — the UI should render that as "Deleted Account" (see
// CONTEXT.md). If the delete is blocked by a foreign-key constraint, we
// surface a clear message instead of a raw 500.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ detail: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ detail: 'Missing or invalid Authorization header' }, 401)

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) {
    return json({ detail: 'Invalid or expired token' }, 401)
  }

  const { data: caller, error: callerError } = await admin
    .from('staff')
    .select('id, auth_user_id, role')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (callerError || !caller) {
    return json({ detail: 'No staff record found for this user' }, 403)
  }
  if (caller.role !== 'ADMIN') {
    return json({ detail: 'Only admins can permanently delete staff accounts' }, 403)
  }

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ detail: 'Invalid JSON body' }, 400)
  }

  const { userId } = body
  if (!userId) return json({ detail: 'userId is required' }, 400)

  if (caller.auth_user_id === userId) {
    return json({ detail: 'You cannot delete your own account' }, 400)
  }

  const { error: deleteStaffError } = await admin.from('staff').delete().eq('auth_user_id', userId)

  if (deleteStaffError) {
    const message = deleteStaffError.message ?? ''
    if (message.toLowerCase().includes('foreign key') || message.toLowerCase().includes('violates')) {
      return json({
        detail: 'Cannot delete: this staff member has associated records (e.g. assigned connection requests, created events). Deactivate instead.',
      }, 400)
    }
    return json({ detail: message }, 500)
  }

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)
  if (deleteAuthError) return json({ detail: deleteAuthError.message }, 500)

  return json({ success: true, user_id: userId })
})
