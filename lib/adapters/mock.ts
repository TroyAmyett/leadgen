import { EnrichmentProvider, EnrichmentInput, EnrichmentResult } from './types'
import type { LeadUpdate } from '@/lib/types/database'

export class MockProvider extends EnrichmentProvider {
  name = 'Mock Provider (Dev)'

  async enrichLead(input: EnrichmentInput): Promise<EnrichmentResult> {
    const { lead } = input

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const domain = lead.email
      ? lead.email.split('@')[1]
      : lead.company
      ? lead.company.toLowerCase().replace(/\s+/g, '') + '.com'
      : 'example.com'

    const updates: Partial<LeadUpdate> = {
      enrichment_status: 'enriched',
      enrichment_provider: this.name,
      enriched_at: new Date().toISOString(),
    }

    // Generate mock data if fields are empty
    if (!lead.email && lead.first_name && lead.last_name) {
      updates.email = `${lead.first_name.toLowerCase()}.${lead.last_name.toLowerCase()}@${domain}`
    }

    if (!lead.phone) {
      updates.phone = `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(
        1000 + Math.random() * 9000
      )}`
    }

    if (!lead.title) {
      const titles = [
        'CEO',
        'CTO',
        'Marketing Director',
        'Sales Manager',
        'VP of Operations',
        'Founder',
      ]
      updates.title = titles[Math.floor(Math.random() * titles.length)]
    }

    if (!lead.linkedin_url && lead.first_name && lead.last_name) {
      updates.linkedin_url = `https://linkedin.com/in/${lead.first_name.toLowerCase()}-${lead.last_name.toLowerCase()}`
    }

    // Add mock enrichment data
    const enrichmentData = {
      ...(lead.enrichment_data as Record<string, unknown> || {}),
      mock_result: {
        generated: true,
        company_size: '10-50',
        industry: 'Technology',
        enriched_at: new Date().toISOString(),
      },
    }
    updates.enrichment_data = enrichmentData

    return {
      success: true,
      data: updates,
      provider: this.name,
      metadata: {
        mock: true,
      },
    }
  }
}
