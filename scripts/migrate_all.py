import csv
import re
from datetime import datetime
from supabase import create_client

# Supabase credentials
SUPABASE_URL = ""
SUPABASE_SECRET_KEY = ""

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

# Cache for lookups
member_cache = {}
third_party_cache = {}
staff_cache = {}
request_cache = {}


def normalize(text):
    """Normalize text: lowercase, collapse multiple spaces, strip."""
    if not text:
        return ''
    return re.sub(r'\s+', ' ', text.strip().lower())


def parse_date(date_str):
    if not date_str or date_str.strip() == '':
        return None
    date_str = date_str.strip()
    formats = [
        '%d/%m/%Y %I:%M%p',
        '%d/%m/%Y %I:%M %p',
        '%d/%m/%Y',
        '%m/%d/%Y',
        '%Y-%m-%d',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).isoformat()
        except:
            continue
    return None


def parse_array(value):
    if not value or value.strip() == '':
        return None
    items = re.split(r'[,\n]', value)
    result = [item.strip() for item in items if item.strip()]
    return result if result else None


def parse_bool(value):
    if not value:
        return False
    return value.lower().strip() in ['yes', 'true', 'checked', '1']


def parse_int(value):
    if not value or value.strip() == '':
        return None
    try:
        return int(value.strip())
    except:
        return None


def parse_time_to_mins(value):
    """Parse time like '0:34' or '1:30' to minutes"""
    if not value or value.strip() == '':
        return None
    try:
        parts = value.strip().split(':')
        if len(parts) == 2:
            hours = int(parts[0])
            mins = int(parts[1])
            return hours * 60 + mins
    except:
        pass
    return None


def split_name(full_name):
    if not full_name:
        return '', ''
    # Normalize spaces first
    full_name = re.sub(r'\s+', ' ', full_name.strip())
    parts = full_name.split(' ', 1)
    first_name = parts[0] if parts else ''
    last_name = parts[1] if len(parts) > 1 else ''
    return first_name, last_name


def map_status(status):
    if not status:
        return 'PENDING'
    status_lower = status.lower().strip()
    if status_lower == 'active':
        return 'ACTIVE'
    elif status_lower == 'inactive':
        return 'INACTIVE'
    elif status_lower == 'churned':
        return 'CHURNED'
    return 'PENDING'


def map_connection_type(type_str):
    if not type_str:
        return 'B2B'
    type_map = {
        'b2b': 'B2B',
        'investment': 'INVESTMENT',
        'strategic': 'STRATEGIC',
        'legal': 'LEGAL',
        'financial': 'FINANCIAL',
        'deal': 'B2B',
        'client': 'B2B',
        'relationship': 'STRATEGIC',
        'health': 'B2B',
    }
    return type_map.get(type_str.lower().strip(), 'B2B')


def map_connection_stage(stage_str):
    if not stage_str:
        return 'REQUEST_MADE'
    if 'made' in stage_str.lower():
        return 'CONNECTION_MADE'
    return 'REQUEST_MADE'


# ============================================
# CACHE LOADING
# ============================================

def load_member_cache():
    """Load all members into cache for quick lookup"""
    global member_cache
    member_cache = {}
    
    result = supabase.table('members').select('id, first_name, last_name').execute()
    
    for member in result.data:
        first = (member['first_name'] or '').strip()
        last = (member['last_name'] or '').strip()
        
        # Full name normalized
        full_name = normalize(f"{first} {last}")
        if full_name:
            member_cache[full_name] = member['id']
        
        # First name only (for partial matches)
        first_norm = normalize(first)
        if first_norm and len(first_norm) >= 3 and first_norm not in member_cache:
            member_cache[first_norm] = member['id']
    
    print(f"✓ Loaded {len(result.data)} members ({len(member_cache)} cache entries)")


def load_third_party_cache():
    """Load all third parties into cache"""
    global third_party_cache
    third_party_cache = {}
    
    result = supabase.table('third_parties').select('id, name').execute()
    
    for tp in result.data:
        name_norm = normalize(tp['name'])
        if name_norm:
            third_party_cache[name_norm] = tp['id']
    
    print(f"✓ Loaded {len(result.data)} third parties")


def load_staff_cache():
    """Load all staff into cache"""
    global staff_cache
    staff_cache = {}
    
    result = supabase.table('staff').select('id, first_name, last_name').execute()
    
    for s in result.data:
        first = (s.get('first_name') or '').strip()
        last = (s.get('last_name') or '').strip()
        
        full_name = normalize(f"{first} {last}")
        if full_name:
            staff_cache[full_name] = s['id']
        
        first_norm = normalize(first)
        if first_norm:
            staff_cache[first_norm] = s['id']
    
    print(f"✓ Loaded {len(result.data)} staff")


# ============================================
# LOOKUP FUNCTIONS
# ============================================

def find_member_id(name):
    """Find member ID by name"""
    if not name:
        return None
    
    name_norm = normalize(name)
    if not name_norm:
        return None
    
    # Exact match
    if name_norm in member_cache:
        return member_cache[name_norm]
    
    # Partial match (substring)
    for cached_name, member_id in member_cache.items():
        if len(name_norm) >= 4 and len(cached_name) >= 4:
            if name_norm in cached_name or cached_name in name_norm:
                return member_id
    
    return None


def find_third_party_id(name):
    """Find third party ID by name"""
    if not name:
        return None
    
    name_norm = normalize(name)
    if not name_norm:
        return None
    
    # Exact match
    if name_norm in third_party_cache:
        return third_party_cache[name_norm]
    
    # Partial match
    for cached_name, tp_id in third_party_cache.items():
        if len(name_norm) >= 3 and len(cached_name) >= 3:
            if name_norm in cached_name or cached_name in name_norm:
                return tp_id
    
    return None


def find_staff_id(name):
    """Find staff ID by name"""
    if not name:
        return None
    
    name_norm = normalize(name)
    if not name_norm:
        return None
    
    if name_norm in staff_cache:
        return staff_cache[name_norm]
    
    for cached_name, staff_id in staff_cache.items():
        if name_norm in cached_name or cached_name in name_norm:
            return staff_id
    
    return None


# ============================================
# MIGRATE THIRD PARTIES
# ============================================

def migrate_third_parties(csv_path):
    print("\n=== Migrating Third Parties ===")
    success_count = 0
    error_count = 0
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            name = row.get('name', '').strip()
            if not name:
                continue
            
            tp_data = {
                'name': name,
                'email': row.get('email', '').strip() or None,
                'phone': row.get('phone number', '').strip() or None,
            }
            
            try:
                supabase.table('third_parties').insert(tp_data).execute()
                print(f"  ✓ {name}")
                success_count += 1
            except Exception as e:
                print(f"  ✗ {name}: {e}")
                error_count += 1
    
    print(f"\nThird Parties: {success_count} success, {error_count} errors")


# ============================================
# MIGRATE REQUESTS
# ============================================

def migrate_requests(csv_path):
    global request_cache
    print("\n=== Migrating Requests ===")
    success_count = 0
    error_count = 0
    skipped_count = 0
    unmatched_members = set()
    unmatched_tps = set()
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            description = row.get('Description', '').strip()
            if not description:
                continue
            
            # Get client name
            client_name = row.get('Client', '').strip()
            if not client_name:
                skipped_count += 1
                continue
            
            # Parse client names (could be comma-separated)
            client_names = [c.strip() for c in client_name.split(',') if c.strip()]
            member_id = find_member_id(client_names[0]) if client_names else None
            
            if not member_id:
                unmatched_members.add(client_name)
                skipped_count += 1
                continue
            
            # Find potential connections (inside network = members)
            inside_network = row.get('Potential Connections (Inside Network)', '').strip()
            inside_names = [n.strip() for n in inside_network.split(',') if n.strip()]
            target_member_ids = []
            for name in inside_names:
                mid = find_member_id(name)
                if mid:
                    target_member_ids.append(mid)
                else:
                    unmatched_members.add(f"[target] {name}")
            
            # Find potential connections (outside network = third parties)
            outside_network = row.get('Potential Connections (Outside Network)', '').strip()
            outside_names = [n.strip() for n in outside_network.split(',') if n.strip()]
            target_third_party_ids = []
            for name in outside_names:
                tpid = find_third_party_id(name)
                if tpid:
                    target_third_party_ids.append(tpid)
                else:
                    unmatched_tps.add(name)
            
            request_data = {
                'requesting_member_id': member_id,
                'description': description,
                'type': map_connection_type(row.get('Type')),
                'stage': map_connection_stage(row.get('Stage')),
                'assigned_staff_id': find_staff_id(row.get('Owner')),
                'target_members': target_member_ids if target_member_ids else None,
                'target_third_parties': target_third_party_ids if target_third_party_ids else None,
                'connection_time_mins': parse_time_to_mins(row.get('Connection Time')),
            }
            
            try:
                result = supabase.table('connection_requests').insert(request_data).execute()
                request_id = result.data[0]['id']
                request_cache[normalize(description[:100])] = request_id
                
                targets = len(target_member_ids) + len(target_third_party_ids)
                print(f"  ✓ {description[:45]}... ({targets} targets)")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error: {e}")
                error_count += 1
    
    print(f"\nRequests: {success_count} success, {error_count} errors, {skipped_count} skipped")
    
    if unmatched_members:
        print(f"\n⚠ Unmatched members ({len(unmatched_members)}):")
        for name in sorted(unmatched_members)[:10]:
            print(f"    - {name}")
    
    if unmatched_tps:
        print(f"\n⚠ Unmatched third parties ({len(unmatched_tps)}):")
        for name in sorted(unmatched_tps)[:10]:
            print(f"    - {name}")


# ============================================
# MIGRATE CONNECTIONS
# ============================================

def migrate_connections(csv_path):
    print("\n=== Migrating Connections ===")
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            title = row.get('Title', '').strip()
            description = row.get('Description', '').strip()
            
            if not title and not description:
                continue
            
            # Find from member
            from_name = row.get('Connection From', '').strip()
            from_names = [n.strip() for n in from_name.split(',') if n.strip()]
            from_member_id = find_member_id(from_names[0]) if from_names else None
            
            # Find to member (inside network)
            to_inside = row.get('Connection To (Inside Network)', '').strip()
            to_inside_names = [n.strip() for n in to_inside.split(',') if n.strip()]
            to_member_id = find_member_id(to_inside_names[0]) if to_inside_names else None
            
            # Find to third party (outside network)
            to_outside = row.get('Connection To (Outside Network)', '').strip()
            to_third_party_id = find_third_party_id(to_outside) if to_outside else None
            
            # Skip if no from member and name was provided
            if from_name and not from_member_id:
                skipped_count += 1
                continue
            
            # Skip if no valid target
            if not to_member_id and not to_third_party_id:
                skipped_count += 1
                continue
            
            # Try to find request
            request_desc = row.get('Request', '').strip()
            request_id = None
            if request_desc:
                request_key = normalize(request_desc[:100])
                request_id = request_cache.get(request_key)
            
            # Create request if not found
            if not request_id and from_member_id:
                try:
                    req_data = {
                        'requesting_member_id': from_member_id,
                        'description': request_desc or description or title or 'Connection request',
                        'type': map_connection_type(row.get('Type')),
                        'stage': 'CONNECTION_MADE',
                        'target_members': [to_member_id] if to_member_id else None,
                        'target_third_parties': [to_third_party_id] if to_third_party_id else None,
                    }
                    req_result = supabase.table('connection_requests').insert(req_data).execute()
                    request_id = req_result.data[0]['id']
                except Exception as e:
                    print(f"  ⚠ Could not create request: {e}")
                    skipped_count += 1
                    continue
            
            if not request_id:
                skipped_count += 1
                continue
            
            connection_data = {
                'request_id': request_id,
                'title': title or (description[:100] if description else 'Connection'),
                'description': description or None,
                'from_member_id': from_member_id,
                'to_member_id': to_member_id,
                'to_third_party_id': to_third_party_id,
                'type': map_connection_type(row.get('Type')),
                'connection_time_mins': parse_time_to_mins(row.get('Connection Time')),
                'occurred_at': parse_date(row.get('Occurred At')),
                'approved_for_site': parse_bool(row.get('Approved for Site')),
                'outcome': row.get('Connection Outcome', '').strip() or None,
            }
            
            try:
                supabase.table('connections').insert(connection_data).execute()
                print(f"  ✓ {title or description[:45]}...")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error: {e}")
                error_count += 1
    
    print(f"\nConnections: {success_count} success, {error_count} errors, {skipped_count} skipped")


# ============================================
# MAIN
# ============================================

def main():
    import sys
    
    print("="*60)
    print("THE CAVE - Data Migration")
    print("="*60)
    
    if len(sys.argv) < 4:
        print("\nUsage:")
        print("  python migrate.py <third_parties.csv> <requests.csv> <connections.csv>")
        print("\nExample:")
        print("  python migrate.py third_party-Grid_view.csv Requests-Grid_view.csv Connections-Grid_view.csv")
        return
    
    third_parties_csv = sys.argv[1]
    requests_csv = sys.argv[2]
    connections_csv = sys.argv[3]
    
    # 1. Migrate third parties
    migrate_third_parties(third_parties_csv)
    
    # 2. Load caches
    print("\n=== Loading Caches ===")
    load_member_cache()
    load_third_party_cache()
    load_staff_cache()
    
    # 3. Migrate requests
    migrate_requests(requests_csv)
    
    # 4. Migrate connections
    migrate_connections(connections_csv)
    
    # Summary
    print("\n" + "="*60)
    print("MIGRATION COMPLETE")
    print("="*60)
    
    tp = supabase.table('third_parties').select('id', count='exact').execute()
    req = supabase.table('connection_requests').select('id', count='exact').execute()
    conn = supabase.table('connections').select('id', count='exact').execute()
    
    req_with_targets = supabase.table('connection_requests').select('id', count='exact').not_.is_('target_members', 'null').execute()
    
    print(f"\nFinal counts:")
    print(f"  Third Parties:       {tp.count}")
    print(f"  Connection Requests: {req.count}")
    print(f"    - with targets:    {req_with_targets.count}")
    print(f"  Connections:         {conn.count}")


if __name__ == '__main__':
    main()