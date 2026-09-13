# Hard-deleting a staff account requires real server-side ADMIN auth

No staff-admin action in this app checked authentication or role before this — `create`, `reset-password`, and a pre-existing unused delete path all accepted requests with no caller identity at all, trusting that only the staff frontend called them. Anyone with the URL could already hard-delete any staff account.

We introduced two ways to remove a staff member: Deactivate (reversible, revokes access via `is_active`, open to any staff member — matches the existing no-role-gating convention) and permanent Delete (irreversible, destroys the `staff` row and Supabase Auth user).

For Delete specifically, we decided the risk didn't match the app's existing "anyone can call it" pattern: it's the one action with no undo. So this is the first staff-admin action that requires a real Bearer token and checks `role === 'ADMIN'` server-side (see `supabase/functions/staff-delete/index.ts`). The alternative — just hiding the "Delete Permanently" button for non-admins in the UI — was rejected because it's trivially bypassed by calling the function directly, which defeats the point of gating an irreversible action.

Anyone extending this pattern to other actions should know: `role` values on `staff` rows are currently set by hand in the Supabase dashboard (nothing in the codebase writes them), so there's no self-service way for an admin to grant/revoke ADMIN today.

_Superseded in mechanism, not intent, by [0002](./0002-staff-admin-moved-to-edge-functions.md): the check now lives in a Supabase Edge Function instead of the-cave-ai-api's FastAPI route, but the decision to require it stands._
