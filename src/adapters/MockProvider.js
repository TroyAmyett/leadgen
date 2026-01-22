import { EnrichmentProvider } from './EnrichmentProvider';

export class MockProvider extends EnrichmentProvider {
  constructor() {
    super();
    this.name = 'Mock Provider (Dev)';
  }

  async enrichLead(lead) {
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock enrichment logic
    const domain = lead.email ? lead.email.split('@')[1] : 'unknown.com';

    return {
      ...lead,
      // Add fake enriched fields
      title: lead.title || 'Senior Manager',
      company: lead.company || domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0] + ' Inc.',
      linkedin: `https://linkedin.com/in/${lead.firstName || 'user'}-${lead.lastName || 'name'}`,
      employees: '50-200',
      industry: 'Software Development',
      leadSource: this.name,
      enrichedBy: this.name,
      enrichedAt: new Date().toISOString()
    };
  }
}
