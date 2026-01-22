import { MockProvider } from '../adapters/MockProvider';
import { ApifyProvider } from '../adapters/ApifyProvider';
import { LocalScraperProvider } from '../adapters/LocalScraperProvider';

export class EnrichmentService {
    constructor() {
        this.localProvider = new LocalScraperProvider();
        this.apifyProvider = null; // Initialize only if key provided
        this.mockProvider = new MockProvider();
    }

    setProvider(type, apiKey = '') {
        // We always keep localProvider active as the first step
        if (type === 'apify') {
            this.apifyProvider = new ApifyProvider(apiKey);
        } else if (type === 'mock') {
            this.forceMock = true;
        }
    }

    async enrich(data) {
        if (Array.isArray(data)) {
            // Sequential for safety/rate limits, or parallel? 
            // Let's do parallel for local, but throttle for Apify
            return Promise.all(data.map(item => this.enrichLead(item)));
        }
        return this.enrichLead(data);
    }

    async enrichLead(lead) {
        if (this.forceMock) {
            return this.mockProvider.enrichLead(lead);
        }

        // 1. Try Local Scraper
        let currentLead = lead;
        console.log(`[Enrichment] Starting Local Scrape for ${lead.firstName} ${lead.lastName}...`);
        currentLead = await this.localProvider.enrichLead(currentLead);

        // 2. Check if we have what we need (Email AND Phone)
        const hasEmail = Boolean(currentLead.email);
        const hasPhone = Boolean(currentLead.phone);

        if (hasEmail && hasPhone) {
            console.log('[Enrichment] Complete via Local Scraper');
            return currentLead;
        }

        // 3. Fallback to Apify if available and still missing data
        if (this.apifyProvider && this.apifyProvider.validateConfig()) {
            console.log(`[Enrichment] Local incomplete. Falling back to Apify for ${lead.firstName}...`);
            // Only update fields that are still missing? Apify provider usually returns full object
            // We might want to pass specific flag or just let it run
            const apifyResult = await this.apifyProvider.enrichLead(currentLead);
            return apifyResult;
        }

        return currentLead;
    }

    getCurrentProviderName() {
        const parts = ['Local Scraper'];
        if (this.apifyProvider) parts.push('Apify');
        return parts.join(' + ');
    }
}

export const enrichmentService = new EnrichmentService();
