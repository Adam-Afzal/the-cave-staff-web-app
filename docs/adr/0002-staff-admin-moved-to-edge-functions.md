# Staff-admin actions moved from the-cave-ai-api to Supabase Edge Functions

Staff create/reset-password/deactivate/reactivate/delete were originally FastAPI routes in a separately-hosted service, `the-cave-ai-api`, because they need the Supabase service-role key — a secret that can't be shipped to the browser. That backend is no longer deployed, which broke all staff management (and, unrelated to this app, engagement/B2B/analytics, which also called it).

None of the staff-admin actions actually need anything specific to that backend (no AI/agent logic, no Telegram integration for these particular actions) — they only need *some* place to hold the service-role key and run privileged Supabase Admin API calls. Rather than redeploy a whole FastAPI server just for this, we ported the five actions to Supabase Edge Functions living in this repo (`supabase/functions/staff-*`), called via `supabase.functions.invoke()`. This removes the staff-web-app's dependency on a separately-hosted server entirely for staff management.

Telegram avatar lookup/sync (also previously served by the-cave-ai-api, via a Telethon session) was explicitly dropped rather than ported — it's not needed right now. The "Lookup" UI in the Add Staff form was removed; self-service avatar sync in Profile Setup / Edit Profile still points at the dead backend and was left as-is pending a decision on whether to remove it too.

Engagement, B2B, and Analytics pages still depend on the-cave-ai-api and remain broken until it's redeployed or migrated separately — that wasn't in scope here.
