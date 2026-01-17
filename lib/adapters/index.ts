import { EnrichmentProvider } from './types'
import { LocalScraperProvider } from './local-scraper'
import { ApifyProvider } from './apify'
import { MockProvider } from './mock'

export type ProviderType = 'local' | 'apify' | 'mock'

export function createProvider(
  type: ProviderType,
  apiKey?: string,
  config: Record<string, unknown> = {}
): EnrichmentProvider {
  switch (type) {
    case 'local':
      return new LocalScraperProvider(config)
    case 'apify':
      if (!apiKey) {
        throw new Error('Apify requires an API key')
      }
      return new ApifyProvider(apiKey, config)
    case 'mock':
      return new MockProvider()
    default:
      throw new Error(`Unknown provider type: ${type}`)
  }
}

export { EnrichmentProvider, LocalScraperProvider, ApifyProvider, MockProvider }
export type { EnrichmentInput, EnrichmentResult } from './types'
