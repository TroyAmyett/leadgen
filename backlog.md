# 🧊 The Icebox (Project Backlog)

This file tracks feature requests and ideas for future versions or phases of the Lead Gen application.

---

## Use Case 1: Enrichment API

**Priority:** High | **Status:** Planned

External API endpoint for programmatic lead enrichment.

### Requirements
- `POST /api/enrich` endpoint
- Accept single lead or array of leads (batch)
- Return enriched fields: email, phone, address, socials, contacts (name/title)
- Support for API key authentication
- Rate limiting for batch requests

### Request Format
```json
{
  "leads": [
    {
      "company": "Acme Corp",
      "website": "https://acmecorp.com",
      "city": "Miami",
      "state": "FL"
    }
  ]
}
```

### Response Format
```json
{
  "results": [
    {
      "success": true,
      "lead": {
        "company": "Acme Corp",
        "email": "info@acmecorp.com",
        "phone": "(305) 555-1234",
        "address": {
          "street": "123 Main St",
          "city": "Miami",
          "state": "FL",
          "postal_code": "33101"
        },
        "socials": {
          "facebook": "https://facebook.com/acmecorp",
          "linkedin": "https://linkedin.com/company/acmecorp"
        },
        "contacts": [
          { "name": "John Smith", "title": "CEO" }
        ]
      }
    }
  ]
}
```

### Future Enhancements
- Webhook callback for async batch processing
- Priority queue for paid tiers
- Caching layer for repeated lookups

---

## Use Case 2: Icebreaker Generator

**Priority:** Medium | **Status:** Planned

AI-powered personalized email opener generation based on scraped data.

### Example Outputs

**Church:**
> "Congratulations on celebrating 50 years of ministry! Your commitment to the Coral Springs community is inspiring."

**Business:**
> "I noticed you recently expanded to your new location on Main Street - exciting growth!"

### Data Sources for Icebreakers
- About Us page content
- Recent news/blog posts
- Staff/leadership changes
- Anniversary/milestone mentions
- New locations/expansions
- Awards/recognition

### Implementation Notes
- Use OpenAI/Claude API for generation
- Cache generated icebreakers with lead data
- Allow manual editing before use

### Free/Low-Cost Integration APIs to Explore
- **Google News API** - Recent news mentions (limited free tier)
- **Bing News Search** - Alternative news source (free tier available)
- **RSS Feeds** - Scrape company blog/news RSS if available
- **Wayback Machine API** - Historical website changes (free)
- **Google Custom Search** - Find press releases, mentions (100 queries/day free)
- **Social Blade** - Social media growth stats (limited free)
- **Hunter.io** - Email patterns (25 free/month)
- **Clearbit Logo API** - Company logos (free)
- **BuiltWith** - Tech stack info (limited free)
- **Local LLM (Ollama)** - Run Llama/Mistral locally for free AI generation

---

## Use Case 3: B2B vs B2C Scraping Modes

**Priority:** High | **Status:** Planned

Different lead types require different data sources and scraping strategies.

### B2C Leads (Current - Churches, Local Businesses)
- Company website scraping
- Google Maps / local directories
- Facebook pages
- Local news mentions
- Staff/team pages for contacts

### B2B Leads (New)
- **LinkedIn Company Pages** - Company size, industry, employee count
- **LinkedIn Sales Navigator** - Decision makers, job titles
- **Crunchbase** - Funding, investors, company stage
- **TechCrunch / Tech News** - Recent funding, product launches
- **AngelList** - Startup data, team info
- **Glassdoor** - Company size, culture signals
- **ZoomInfo** (paid) - Contact database
- **Apollo.io** - Email finder + company data
- **PitchBook** - Financial/investment data

### B2B Data Points to Capture
- Company size (employees)
- Industry/vertical
- Tech stack (BuiltWith, Wappalyzer)
- Funding stage/amount
- Decision maker contacts (C-suite, VPs)
- Recent news/press releases
- Job postings (hiring signals)
- Revenue estimates

### Implementation Approach
- Add "Lead Type" selector on import: B2B / B2C / Auto-detect
- Different scraping pipelines per type
- B2B: Prioritize LinkedIn, Crunchbase, tech news
- B2C: Prioritize website, Google Maps, local directories
- Auto-detect based on company signals (funding mentions, tech stack, etc.)

### Free B2B Data Sources
- **LinkedIn (public profiles)** - Limited without API
- **Crunchbase (free tier)** - Basic company data
- **GitHub** - For tech companies (repos, team)
- **Product Hunt** - Startup launches
- **Y Combinator directory** - YC companies
- **Google News** - Press mentions
- **SEC EDGAR** - Public company filings (free)

---

### Contact & Enrichment

- [ ] **Extended Social Scraping**: Deep scrape LinkedIn, Instagram, and Twitter for matching contact profiles.
- [ ] **Google Maps Integration**: Pull "Claimed/Unclaimed" status and additional address data directly from Google Maps.
- [ ] **AI Summarization**: Use LLM to summarize the "About Us" page for each lead to help with personalized outreach.
- [ ] **Advanced Pattern Discovery**: Search specific document repositories (SlideShare, PDF docs) and video platforms (YouTube descriptions) for email addresses to deduce patterns when web scraping fails.

### Workspace & Management

- [ ] **Lead Buckets/Folders**: Organize leads into specific campaigns or status buckets (e.g., "Cold", "Warm", "Sent").
- [ ] **CRM Sync**: One-click export or background sync to CRM platforms like HubSpot or Salesforce.
- [ ] **Advanced Deduplication**: identify potential duplicates across different imports using fuzzy matching on names and addresses.

### UI/UX

- [ ] **Bulk Actions**: Select multiple leads to Enrich, Delete, or Export at once.
- [ ] **Dark Mode Toggle**: Allow users to switch between the sleek dark theme and a high-contrast light theme.
- [ ] **Enrichment Progress Bar**: A visual indicator of progress when running large batches of enrichments.

### Code Cleanup

- [ ] **Remove Church-Specific Logic**: The current scraper has church-specific naming conventions and search patterns (e.g., searching for "church" in company names, Christ Fellowship patterns). These were built for the charity account but should be generalized for other business types.
