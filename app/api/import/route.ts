import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { LeadInsert, Json } from '@/lib/types/database'

interface ImportRequest {
  leads: Array<Record<string, unknown>>
  columnMapping: Record<string, string>
  accountId: string
  userId: string
  filename: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body: ImportRequest = await request.json()
    const { leads, columnMapping, accountId, userId, filename } = body

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads to import' }, { status: 400 })
    }

    if (!accountId || !userId) {
      return NextResponse.json(
        { error: 'accountId and userId required' },
        { status: 400 }
      )
    }

    // Create import batch record
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        account_id: accountId,
        filename: filename || 'import.csv',
        total_rows: leads.length,
        column_mapping: columnMapping,
        status: 'processing',
        started_at: new Date().toISOString(),
        created_by: userId,
        created_by_type: 'user',
      })
      .select()
      .single()

    if (batchError) throw batchError

    // Map CSV rows to lead records
    let importedCount = 0
    let failedCount = 0
    const errors: string[] = []

    const leadsToInsert: LeadInsert[] = []

    for (let i = 0; i < leads.length; i++) {
      const row = leads[i]
      try {
        const lead: LeadInsert = {
          account_id: accountId,
          created_by: userId,
          created_by_type: 'user',
          updated_by: userId,
          updated_by_type: 'user',
          source: 'csv_import',
          source_details: { batch_id: batch.id, row_index: i, original_data: row as Record<string, string> } as unknown as Json,
          enrichment_status: 'pending',
          status: 'new',
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
              // Add more field mappings as needed
            }
          }
        }

        leadsToInsert.push(lead)
      } catch (err) {
        failedCount++
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Bulk insert leads
    if (leadsToInsert.length > 0) {
      const { data: insertedLeads, error: insertError } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select()

      if (insertError) {
        console.error('Bulk insert error:', insertError)
        failedCount += leadsToInsert.length
      } else {
        importedCount = insertedLeads?.length || 0
      }
    }

    // Update batch record
    await supabase
      .from('import_batches')
      .update({
        imported_rows: importedCount,
        failed_rows: failedCount,
        status: failedCount === leads.length ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        error: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
      })
      .eq('id', batch.id)

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      imported: importedCount,
      failed: failedCount,
      total: leads.length,
      errors: errors.slice(0, 10),
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
