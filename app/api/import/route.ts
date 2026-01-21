import { NextRequest, NextResponse } from 'next/server'

interface ImportRequest {
  leads: Array<Record<string, unknown>>
  columnMapping: Record<string, string>
  filename?: string
}

interface MappedLead {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  website?: string
  linkedin_url?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  source: string
  status: string
  enrichment_status: string
  original_data: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()
    const { leads, columnMapping, filename } = body

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads to import' }, { status: 400 })
    }

    // Map CSV rows to lead objects (in-memory only, no database)
    const mappedLeads: MappedLead[] = []
    const errors: string[] = []

    for (let i = 0; i < leads.length; i++) {
      const row = leads[i]
      try {
        const lead: MappedLead = {
          id: crypto.randomUUID(),
          source: 'csv_import',
          status: 'new',
          enrichment_status: 'pending',
          original_data: row as Record<string, unknown>,
        }

        // Map fields based on column mapping
        for (const [csvColumn, leadField] of Object.entries(columnMapping)) {
          const value = row[csvColumn]
          if (value !== undefined && value !== null && value !== '') {
            switch (leadField) {
              case 'first_name':
                lead.first_name = String(value)
                break
              case 'last_name':
                lead.last_name = String(value)
                break
              case 'email':
                lead.email = String(value).toLowerCase()
                break
              case 'phone':
                lead.phone = String(value)
                break
              case 'company':
                lead.company = String(value)
                break
              case 'title':
                lead.title = String(value)
                break
              case 'website':
                lead.website = String(value)
                break
              case 'linkedin_url':
                lead.linkedin_url = String(value)
                break
              case 'address':
                lead.address = String(value)
                break
              case 'city':
                lead.city = String(value)
                break
              case 'state':
                lead.state = String(value)
                break
              case 'postal_code':
                lead.postal_code = String(value)
                break
            }
          }
        }

        mappedLeads.push(lead)
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported: mappedLeads.length,
      failed: errors.length,
      total: leads.length,
      leads: mappedLeads,
      errors: errors.slice(0, 10),
      filename: filename || 'import.csv',
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to import leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
