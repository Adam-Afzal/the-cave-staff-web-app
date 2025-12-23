import csv
from datetime import datetime
from supabase import create_client

# Supabase credentials
SUPABASE_URL = ""
SUPABASE_SECRET_KEY = ""

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

def parse_date(date_str):
    """Parse date from various formats"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        return datetime.strptime(date_str.strip(), '%m/%d/%Y').isoformat()
    except:
        try:
            return datetime.strptime(date_str.strip(), '%d/%m/%Y').isoformat()
        except:
            try:
                return datetime.strptime(date_str.strip().split(' ')[0], '%m/%d/%Y').isoformat()
            except:
                return None

def parse_array(value):
    """Parse comma or newline separated string into array"""
    if not value or value.strip() == '':
        return None
    import re
    items = re.split(r'[,\n]', value)
    result = [item.strip() for item in items if item.strip()]
    return result if result else None

def parse_bool(value):
    """Parse boolean from various formats"""
    if not value:
        return False
    return value.lower().strip() in ['yes', 'true', 'checked', '1']

def parse_int(value):
    """Parse integer"""
    if not value or value.strip() == '':
        return None
    try:
        return int(value.strip())
    except:
        return None

def split_name(full_name):
    """Split full name into first and last name"""
    if not full_name:
        return '', ''
    parts = full_name.strip().split(' ', 1)
    first_name = parts[0] if parts else ''
    last_name = parts[1] if len(parts) > 1 else ''
    return first_name, last_name

def map_status(status):
    """Map Airtable status to our enum"""
    if not status:
        return 'PENDING'
    status_lower = status.lower().strip()
    if status_lower == 'active':
        return 'ACTIVE'
    elif status_lower == 'inactive':
        return 'INACTIVE'
    elif status_lower == 'churned':
        return 'CHURNED'
    else:
        return 'PENDING'

def migrate_csv(csv_path):
    """Migrate Airtable CSV to Supabase"""
    
    success_count = 0
    error_count = 0
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Skip empty rows
            email = row.get('Email', '').strip()
            if not email:
                continue
            
            first_name, last_name = split_name(row.get('Client Name', ''))
            
            # Prepare member data
            member_data = {
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': row.get('Phone Number', '').strip() or None,
                'join_date': parse_date(row.get('Join Date')),
                'renewal_date': parse_date(row.get('Membership Renewal Date')),
                'status': map_status(row.get('Status')),
                'notes': row.get('Notes', '').strip() or None,
                'business_arena': row.get('Business Arena', '').strip() or None,
                'annual_revenue_band': row.get('Annual Revenue Band', '').strip() or None,
                'region': parse_array(row.get('Region')),
                'topics': parse_array(row.get('Topics')),
                'focus': parse_array(row.get('Focus')),
                'net_worth_band': row.get('Net Worth', '').strip() or None,
                'date_of_birth': parse_date(row.get('Date of Birth')),
                'city': row.get('City', '').strip() or None,
                'country': row.get('Country', '').strip() or None,
                'languages': parse_array(row.get('Languages')),
                'investment_interests': parse_array(row.get('Investment Interests')),
                'intro_posted': parse_bool(row.get('Intro Posted?')),
                'value_posted': parse_bool(row.get('Value Posted?')),
                'health_score': parse_int(row.get('Member Health Score')) or 0,
                'year_of_first_business': parse_int(row.get('Year of First Business')),
            }
            
            # Insert member
            try:
                result = supabase.table('members').insert(member_data).execute()
                member_id = result.data[0]['id']
                print(f"✓ Created member: {first_name} {last_name} ({email})")
                success_count += 1
            except Exception as e:
                print(f"✗ Failed to create member {first_name} {last_name} ({email}): {e}")
                error_count += 1
                continue
            
            # Prepare telegram data
            telegram_data = {
                'member_id': member_id,
                'ghl_id': row.get('GHL Id', '').strip() or None,
                'telegram_id': row.get('Telegram Id', '').strip() or None,
                'telegram_username': row.get('Telegram Username', '').strip() or None,
                'telegram_joined': parse_bool(row.get('Telegram Joined?')),
                'posts_count': parse_int(row.get('Telegram Posts Count')) or 0,
                'last_post_date': parse_date(row.get('Last Telegram Post Date')),
            }
            
            try:
                supabase.table('member_telegram').insert(telegram_data).execute()
            except Exception as e:
                print(f"  Warning: Failed to create telegram record: {e}")
            
            # Prepare profile data
            profile_data = {
                'member_id': member_id,
                'first_priority': row.get('First Priority', '').strip() or None,
                'second_priority': row.get('Second Priority', '').strip() or None,
                'bottlenecks': row.get('Bottlenecks', '').strip() or None,
                'outside_business': row.get('Outside Business', '').strip() or None,
                'support': row.get('Support', '').strip() or None,
                'side_assets': row.get('Side Assets', '').strip() or None,
                'hidden_talents': row.get('Hidden Talents', '').strip() or None,
                'offer_summary': row.get('Offer Summary', '').strip() or None,
                'referral_prospects': row.get('Referral Prospects', '').strip() or None,
                'twelve_month_success': row.get('12 Month Success', '').strip() or None,
                'own_description': row.get('Own Description', '').strip() or None,
                'youtube_topics': parse_array(row.get('YouTube Topics')),
                'weekly_calls_interest': parse_array(row.get('Weekly Calls Interest')),
                'board_room': parse_array(row.get('Board Room')),
            }
            
            try:
                supabase.table('member_profile').insert(profile_data).execute()
            except Exception as e:
                print(f"  Warning: Failed to create profile record: {e}")
    
    print(f"\n✓ Migration complete!")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python migrate_airtable.py path/to/Clients-Grid_view.csv")
    else:
        migrate_csv(sys.argv[1])