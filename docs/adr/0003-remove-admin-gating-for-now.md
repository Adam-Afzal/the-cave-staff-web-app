# Remove ADMIN gating from staff delete, for now

ADR 0001 restricted permanent staff deletion to `role === 'ADMIN'`, on the reasoning that it's the one irreversible staff-admin action. In practice, `role` is set by hand in the Supabase dashboard with no self-service way to grant it, and nobody had confirmed which (if any) staff rows actually had `role = 'ADMIN'` set — which meant the Delete button was invisible to everyone, including the person who needed to use it.

Decision: drop the role check from `staff-delete` for now — any authenticated staff member can hard-delete any other staff member (self-delete stays blocked). This matches every other staff-admin action in this app, none of which are role-gated.

This is explicitly a "for now" call, not a reversal of the reasoning in ADR 0001 — the risk of an irreversible action being open to all staff hasn't gone away, it's just been deprioritized until there's an actual way to manage who holds the ADMIN role.
