/**
 * Base class for Enrichment Providers.
 * All providers (Apify, Apollo, Mock) should extend this.
 */
export class EnrichmentProvider {
    constructor(apiKey = '', config = {}) {
        this.apiKey = apiKey;
        this.config = config;
        this.name = 'Generic Provider';
    }

    /**
     * Enrich a single lead.
     * @param {Object} lead - The lead object (must contain at least email or domain).
     * @returns {Promise<Object>} - The enriched data merged with original.
     */
    async enrichLead(lead) {
        throw new Error('enrichLead() must be implemented by provider');
    }

    /**
     * Enrich a batch of leads.
     * Default implementation loops enrichLead, but providers can override for bulk APIs.
     * @param {Array<Object>} leads 
     * @returns {Promise<Array<Object>>}
     */
    async batchEnrich(leads) {
        const results = [];
        for (const lead of leads) {
            try {
                const enriched = await this.enrichLead(lead);
                results.push(enriched);
            } catch (error) {
                console.warn(`Failed to enrich lead ${lead.email}:`, error);
                results.push({ ...lead, enrichmentError: error.message });
            }
        }
        return results;
    }

    validateConfig() {
        return true;
    }
}
