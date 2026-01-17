import {
  createProvider,
  ProviderType,
  EnrichmentProvider,
  EnrichmentInput,
  EnrichmentResult,
} from '@/lib/adapters'
import type { Lead, LeadUpdate } from '@/lib/types/database'

interface EnrichmentConfig {
  defaultProvider: ProviderType
  apiKeys: {
    apify?: string
  }
  fallbackToLocal: boolean
}

export class EnrichmentService {
  private providers: Map<ProviderType, EnrichmentProvider> = new Map()
  private config: EnrichmentConfig

  constructor(config: Partial<EnrichmentConfig> = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'local',
      apiKeys: config.apiKeys || {},
      fallbackToLocal: config.fallbackToLocal ?? true,
    }

    // Initialize default provider
    this.initializeProvider(this.config.defaultProvider)

    // Always initialize local as fallback
    if (this.config.fallbackToLocal && this.config.defaultProvider !== 'local') {
      this.initializeProvider('local')
    }
  }

  private initializeProvider(type: ProviderType) {
    if (this.providers.has(type)) return

    try {
      const apiKey = type === 'apify' ? this.config.apiKeys.apify : undefined
      const provider = createProvider(type, apiKey)
      this.providers.set(type, provider)
    } catch (error) {
      console.warn(`Failed to initialize ${type} provider:`, error)
    }
  }

  async enrichLead(
    lead: Lead,
    providerType?: ProviderType
  ): Promise<EnrichmentResult> {
    const type = providerType || this.config.defaultProvider
    this.initializeProvider(type)

    const provider = this.providers.get(type)
    if (!provider) {
      return {
        success: false,
        error: `Provider ${type} not available`,
        provider: type,
      }
    }

    const input: EnrichmentInput = { lead }
    let result = await provider.enrichLead(input)

    // If primary provider fails and fallback is enabled, try local
    if (
      !result.success &&
      this.config.fallbackToLocal &&
      type !== 'local'
    ) {
      console.log(`${type} failed, falling back to local scraper`)
      const localProvider = this.providers.get('local')
      if (localProvider) {
        result = await localProvider.enrichLead(input)
      }
    }

    return result
  }

  async batchEnrich(
    leads: Lead[],
    providerType?: ProviderType,
    onProgress?: (current: number, total: number) => void
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = []

    for (let i = 0; i < leads.length; i++) {
      const result = await this.enrichLead(leads[i], providerType)
      results.push(result)

      if (onProgress) {
        onProgress(i + 1, leads.length)
      }

      // Add delay between requests to be polite
      if (i < leads.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 1000)
        )
      }
    }

    return results
  }

  getProviderName(type?: ProviderType): string {
    const t = type || this.config.defaultProvider
    const provider = this.providers.get(t)
    return provider?.name || t
  }

  setApiKey(provider: 'apify', apiKey: string) {
    this.config.apiKeys[provider] = apiKey
    // Reinitialize provider with new key
    this.providers.delete(provider)
    this.initializeProvider(provider)
  }

  setDefaultProvider(type: ProviderType) {
    this.config.defaultProvider = type
    this.initializeProvider(type)
  }
}

// Singleton instance
let enrichmentService: EnrichmentService | null = null

export function getEnrichmentService(
  config?: Partial<EnrichmentConfig>
): EnrichmentService {
  if (!enrichmentService || config) {
    enrichmentService = new EnrichmentService(config)
  }
  return enrichmentService
}
