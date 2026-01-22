# 🧊 The Icebox (Project Backlog)

This file tracks feature requests and ideas for future versions or phases of the Lead Gen application.

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
