import type { Lead, LeadUpdate } from '@/lib/types/database'

export interface EnrichmentResult {
  success: boolean
  data?: Partial<LeadUpdate>
  error?: string
  provider: string
  metadata?: Record<string, unknown>
}

export interface EnrichmentInput {
  lead: Lead
  options?: {
    skipSearch?: boolean
    forceRefresh?: boolean
  }
}

export abstract class EnrichmentProvider {
  abstract name: string
  protected apiKey?: string
  protected config: Record<string, unknown>

  constructor(apiKey?: string, config: Record<string, unknown> = {}) {
    this.apiKey = apiKey
    this.config = config
  }

  abstract enrichLead(input: EnrichmentInput): Promise<EnrichmentResult>

  async batchEnrich(inputs: EnrichmentInput[]): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = []
    for (const input of inputs) {
      try {
        const result = await this.enrichLead(input)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: this.name,
        })
      }
    }
    return results
  }

  validateConfig(): boolean {
    return true
  }
}
