
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Configuration
const SUPABASE_URL = ""
const SUPABASE_SECRET_KEY = ""

const CSV_PATH = './Bi_weekly_check_in_Calls_-_zeshan-Grid_view.csv'

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

interface CsvRow {
  fathom_recording: string
  name: string
  client: string
  date_of_call: string
  request: string
  notes_of_call: string
  feedback: string
  clients_copy: string
}

interface MemberMap {
  [key: string]: string
}

function parseCSV(content: string): CsvRow[] {
  const rows: CsvRow[] = []
  
  // Parse CSV handling multi-line quoted fields
  const values: string[] = []
  let current = ''
  let inQuotes = false
  let rowCount = 0
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    
    if (char === '"') {
      // Check for escaped quote ""
      if (inQuotes && content[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Skip \r if followed by \n
      if (char === '\r' && content[i + 1] === '\n') {
        i++
      }
      
      values.push(current)
      current = ''
      
      // Process row (skip header row)
      if (rowCount > 0 && values.length >= 7) {
        rows.push({
          fathom_recording: values[0]?.trim() || '',
          name: values[1]?.trim() || '',
          client: values[2]?.trim() || '',
          date_of_call: values[3]?.trim() || '',
          request: values[4]?.trim() || '',
          notes_of_call: values[5]?.trim() || '',
          feedback: values[6]?.trim() || '',
          clients_copy: values[7]?.trim() || '',
        })
      }
      
      rowCount++
      values.length = 0
    } else {
      current += char
    }
  }
  
  // Handle last row if no trailing newline
  if (current || values.length > 0) {
    values.push(current)
    if (rowCount > 0 && values.length >= 7) {
      rows.push({
        fathom_recording: values[0]?.trim() || '',
        name: values[1]?.trim() || '',
        client: values[2]?.trim() || '',
        date_of_call: values[3]?.trim() || '',
        request: values[4]?.trim() || '',
        notes_of_call: values[5]?.trim() || '',
        feedback: values[6]?.trim() || '',
        clients_copy: values[7]?.trim() || '',
      })
    }
  }
  
  return rows
}

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null
  
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})(am|pm)?$/i)
  if (match) {
    const [, month, day, year, hour, minute, ampm] = match
    let h = parseInt(hour)
    if (ampm?.toLowerCase() === 'pm' && h !== 12) h += 12
    if (ampm?.toLowerCase() === 'am' && h === 12) h = 0
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:00.000Z`
  }
  
  return null
}

async function loadMembers(): Promise<MemberMap> {
  const { data, error } = await supabase
    .from('members')
    .select('id, first_name, last_name')
  
  if (error) throw error
  
  const map: MemberMap = {}
  for (const member of data || []) {
    const fullName = `${member.first_name} ${member.last_name}`.trim()
    map[normalize(fullName)] = member.id
    
    if (member.first_name) {
      const firstOnly = normalize(member.first_name)
      if (!map[firstOnly]) {
        map[firstOnly] = member.id
      }
    }
  }
  
  return map
}

function findMember(clientName: string, memberMap: MemberMap): string | null {
  const normalized = normalize(clientName)
  
  if (memberMap[normalized]) {
    return memberMap[normalized]
  }
  
  const parts = normalized.split(' ')
  
  if (parts.length >= 2) {
    const firstLast = `${parts[0]} ${parts[parts.length - 1]}`
    if (memberMap[firstLast]) {
      return memberMap[firstLast]
    }
  }
  
  if (parts[0] && memberMap[parts[0]]) {
    return memberMap[parts[0]]
  }
  
  for (const [name, id] of Object.entries(memberMap)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return id
    }
  }
  
  return null
}

async function migrate() {
  console.log('Loading CSV...')
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCSV(csvContent)
  console.log(`Parsed ${rows.length} rows from CSV`)
  
  console.log('Loading members from Supabase...')
  const memberMap = await loadMembers()
  console.log(`Loaded ${Object.keys(memberMap).length} member mappings`)
  
  const toInsert: any[] = []
  const notFound: string[] = []
  let withDate = 0
  let withoutDate = 0
  
  for (const row of rows) {
    if (!row.client || row.client.trim() === '') continue
    
    const memberId = findMember(row.client, memberMap)
    
    if (!memberId) {
      notFound.push(row.client)
      continue
    }
    
    const callDate = parseDate(row.date_of_call)
    
    if (callDate) {
      withDate++
    } else {
      withoutDate++
    }
    
    toInsert.push({
      member_id: memberId,
      recording: row.fathom_recording || null,
      date: callDate,
      notes: row.notes_of_call || null,
      feedback: row.feedback || null,
    })
  }
  
  console.log('\n--- Summary ---')
  console.log(`Records to insert: ${toInsert.length}`)
  console.log(`  - With date: ${withDate}`)
  console.log(`  - Without date: ${withoutDate}`)
  console.log(`Members not found (skipped): ${notFound.length}`)
  
  if (notFound.length > 0) {
    console.log('\nMembers not found in database:')
    const unique = [...new Set(notFound)]
    unique.forEach(name => console.log(`  - ${name}`))
  }
  
  if (toInsert.length === 0) {
    console.log('\nNo records to insert!')
    return
  }
  
  console.log('\nInserting records...')
  
  const batchSize = 50
  let inserted = 0
  let errors = 0
  
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('client_call')
      .insert(batch)
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      console.log(`Inserted batch ${i / batchSize + 1} (${inserted}/${toInsert.length})`)
    }
  }
  
  console.log('\n--- Final Results ---')
  console.log(`Successfully inserted: ${inserted}`)
  console.log(`Errors: ${errors}`)
}

migrate().catch(console.error)