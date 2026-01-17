import { EnrichmentProvider, EnrichmentInput, EnrichmentResult } from './types'
import type { LeadUpdate } from '@/lib/types/database'

interface ScrapeResponse {
  emails: Array<{ email: string; score: number }>
  phones: string[]
  socials: string[]
  facebookUrl: string | null
  officeEmail: string | null
  officePhone: string | null
  addresses: string[]
  url: string | null
  success: boolean
  error?: string
}

export class LocalScraperProvider extends EnrichmentProvider {
  name = 'Local Scraper (Free)'
  private endpoint: string

  constructor(config: Record<string, unknown> = {}) {
    super(undefined, config)
    this.endpoint = (config.endpoint as string) || '/api/scrape'
  }

  async enrichLead(input: EnrichmentInput): Promise<EnrichmentResult> {
    const { lead } = input

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: lead.website,
          firstName: lead.first_name,
          lastName: lead.last_name,
          company: lead.company,
          // Add location if available from enrichment_data
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Scrape request failed',
          provider: this.name,
        }
      }

      const data: ScrapeResponse = await response.json()

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Scrape returned no results',
          provider: this.name,
        }
      }

      // Build the update object
      const updates: Partial<LeadUpdate> = {
        enrichment_status: 'enriched',
        enrichment_provider: this.name,
        enriched_at: new Date().toISOString(),
      }

      // Map scraped data to lead fields
      if (data.emails && data.emails.length > 0) {
        // Get highest scored email
        const bestEmail = data.emails.sort((a, b) => b.score - a.score)[0]
        if (bestEmail && !lead.email) {
          updates.email = bestEmail.email
        }
      }

      if (data.officeEmail && !lead.email) {
        // Use office email as fallback
        updates.email = data.officeEmail
      }

      if (data.phones && data.phones.length > 0 && !lead.phone) {
        updates.phone = data.phones[0]
      }

      if (data.officePhone && !lead.phone) {
        updates.phone = data.officePhone
      }

      if (data.url && !lead.website) {
        updates.website = data.url
      }

      // Store all enrichment data for reference
      const enrichmentData = {
        ...(lead.enrichment_data as Record<string, unknown> || {}),
        scrape_result: {
          emails: data.emails,
          phones: data.phones,
          socials: data.socials,
          facebookUrl: data.facebookUrl,
          officeEmail: data.officeEmail,
          officePhone: data.officePhone,
          addresses: data.addresses,
          url: data.url,
          scraped_at: new Date().toISOString(),
        },
      }
      updates.enrichment_data = enrichmentData

      // Extract social URLs
      if (data.socials) {
        const linkedinUrl = data.socials.find((s) => s.includes('linkedin.com'))
        if (linkedinUrl && !lead.linkedin_url) {
          updates.linkedin_url = linkedinUrl
        }
      }

      return {
        success: true,
        data: updates,
        provider: this.name,
        metadata: {
          emailsFound: data.emails?.length || 0,
          phonesFound: data.phones?.length || 0,
          socialsFound: data.socials?.length || 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      }
    }
  }
}
