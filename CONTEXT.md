# The Cave Staff Web App

Internal admin portal used by Cave staff to manage members, events, connections, and other staff accounts.

## Language

**Staff member**:
An internal team account (`staff` table) with portal login access, distinct from a Member (a client of the Cave).

**Onboarded**:
A staff member who has completed initial profile setup (`onboarding_completed: true`). Purely about profile-setup progress — orthogonal to whether the account currently has access.
_Avoid_: "Active" (ambiguous with access status — see Deactivated)

**Deactivated**:
A staff member whose portal access has been revoked (`is_active: false`) without deleting their record. Reversible — an admin can reactivate them. All historical attribution (assigned connection requests, created events, event attendees they added) remains intact and correctly attributed, since the staff row still exists.
_Avoid_: Removed, disabled, suspended

**Deleted** (staff):
A staff member whose record and login have been permanently destroyed — the `staff` row and the Supabase Auth user are both gone. Irreversible. Restricted to staff with the ADMIN role. Distinct from Deactivated: deletion is a last resort for accounts that should never come back (e.g. departed under circumstances warranting full removal), whereas deactivation is the default way to cut off someone who left.
_Avoid_: Removed, deactivated

**Deleted Account**:
The display fallback shown wherever a record references a staff member by ID (`assigned_staff_id`, `created_by_staff_id`, `added_by_staff_id`) and that staff member has since been Deleted. Distinguishes "this was attributed to someone who no longer exists" from "this was never assigned to anyone."
