import { NextRequest, NextResponse } from 'next/server'
import {
  scrapePage,
  runSearch,
  findWebPresence,
  cleanUrl,
  cleanEmail,
  PHONE_REGEX,
} from '@/lib/scraper'

interface ScrapeRequest {
  url?: string
  firstName?: string
  lastName?: string
  company?: string
  city?: string
  state?: string
  facebookUrl?: string
}

// Default exclusion patterns
const DEFAULT_EXCLUSION_PATTERNS = [
  'example.com',
  'whitepages.com',
  'yellowpages.com',
  'yelp.com',
  'facebook.com',
  'linkedin.com',
  'twitter.com',
  'instagram.com',
  'mapquest.com',
  'superpages.com',
  'chamberofcommerce.com',
  'bbb.org',
  'manta.com',
  'noreply',
  'no-reply',
]

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeRequest = await request.json()
    let { url, firstName, lastName, company, city, state, facebookUrl } = body
    let providedFb = facebookUrl || null

    // Social Search Fallback if no URL provided
    if (!url || url.trim() === '') {
      console.log('No URL provided. Attempting Web Presence Search...')
      let query = ''
      const location = city ? (state ? `${city} ${state}` : city) : ''

      if (company) {
        query = `${company} ${location}`
      } else if (firstName && lastName) {
        query = `${firstName} ${lastName} ${location}`
      }

      if (query) {
        const presence = await findWebPresence(query.trim())

        if (presence.website) {
          console.log(`Found Website: ${presence.website}`)
          url = presence.website
        }

        if (presence.facebook && !providedFb) {
          console.log(`Found Facebook: ${presence.facebook}`)
          providedFb = presence.facebook
        }

        if (!url && providedFb) {
          console.log('No official website found, but Facebook found. Using Facebook for scraping.')
          url = providedFb
        }

        if (!url && !providedFb) {
          return NextResponse.json(
            { error: 'No URL provided and Web Search failed.' },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'URL is required (or Name/Company + City for fallback)' },
          { status: 400 }
        )
      }
    }

    console.log(`Deep Scraping: ${url}`)
    let targetUrl = url!.startsWith('http') ? url! : 'https://' + url

    // Phase 1: Initial Scrape
    console.log('Phase 1: Initial Scrape')
    const firstScrape = await scrapePage(targetUrl)
    let {
      emails,
      phones,
      socials,
      internalLinks,
      officeEmails,
      officePhones,
      addresses,
    } = firstScrape
    console.log(
      `Phase 1 Results: E:${emails.length}, P:${phones.length}, Soc:${socials.length}, Int:${internalLinks.length}`
    )

    // Check for Facebook in scraped socials
    const scrapedFb = socials.find((s) => s.includes('facebook.com'))
    if (scrapedFb && !providedFb) {
      providedFb = scrapedFb
    }

    // Early exit check - if we have email AND phone AND address, skip deeper phases
    const hasBasicInfo = emails.length > 0 && phones.length > 0
    const hasAddress = addresses.length > 0

    // Phase 2: Deep scrape contact page if needed (skip if we have basic info)
    if (!hasBasicInfo && internalLinks.length > 0) {
      const contactUrl =
        internalLinks.find((l) => l.toLowerCase().includes('contact')) || internalLinks[0]
      console.log(`Phase 2: Deeper Scrape -> ${contactUrl}`)
      const deeper = await scrapePage(contactUrl)

      if (deeper) {
        emails = [...emails, ...(deeper.emails || [])]
        phones = [...phones, ...(deeper.phones || [])]
        socials = [...socials, ...(deeper.socials || [])]
        officeEmails = [...officeEmails, ...(deeper.officeEmails || [])]
        officePhones = [...officePhones, ...(deeper.officePhones || [])]
        addresses = [...addresses, ...(deeper.addresses || [])]

        const deeperFb = (deeper.socials || []).find((s) => s.includes('facebook.com'))
        if (deeperFb && !providedFb) providedFb = deeperFb
      }
    } else if (hasBasicInfo) {
      console.log('Phase 2: Skipped (already have email and phone)')
    }

    // Phase 3: Snippet fallback search (only if still missing critical info)
    const stillMissingInfo = emails.length === 0 || phones.length === 0
    if (stillMissingInfo) {
      console.log('Contact info still missing. Performing snippet fallback search...')
      const location = city ? (state ? `${city} ${state}` : city) : ''
      const query = company
        ? `${company} ${location} contact info`
        : url
        ? `${url} contact`
        : ''

      if (query) {
        const searchResults = await runSearch(query)
        searchResults.forEach((res) => {
          const snippetEmails =
            res.snippet
              .toLowerCase()
              .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g) || []
          const snippetPhones = res.snippet.match(PHONE_REGEX) || []
          emails = [...emails, ...snippetEmails]
          phones = [...phones, ...snippetPhones]
        })
      }
    } else {
      console.log('Phase 3: Skipped (have required contact info)')
    }

    // Process and score results
    const patterns = DEFAULT_EXCLUSION_PATTERNS

    let uniqueEmails = [...new Set(emails)]
      .map((e) => cleanEmail(e))
      .filter((e) => {
        if (
          e.includes('.png') ||
          e.includes('.jpg') ||
          e.includes('.jpeg') ||
          e.includes('.svg')
        ) {
          return false
        }
        if (patterns.some((p) => e.includes(p.toLowerCase()))) return false
        return true
      })

    const uniquePhones = [...new Set(phones)].map((p) => p.trim())
    const uniqueSocials = [...new Set(socials)]

    // Score emails
    const scoredEmails = uniqueEmails.map((email) => {
      let score = 0
      const fullEmail = email.toLowerCase()
      const [prefix] = fullEmail.split('@')

      if (patterns.some((p) => fullEmail.includes(p.toLowerCase()))) score -= 30
      if (firstName && prefix.includes(firstName.toLowerCase())) score += 10
      if (lastName && prefix.includes(lastName.toLowerCase())) score += 10

      return { email, score }
    })

    scoredEmails.sort((a, b) => b.score - a.score)

    console.log('Phase 4: Returning Results', {
      foundOfficeEmail: !!officeEmails[0],
      foundOfficePhone: !!officePhones[0],
      emailsCount: scoredEmails.length,
    })

    return NextResponse.json({
      emails: scoredEmails,
      phones: [...new Set(phones)],
      socials: uniqueSocials.map(cleanUrl).filter(Boolean),
      facebookUrl: cleanUrl(providedFb),
      officeEmail: officeEmails && officeEmails.length > 0 ? officeEmails[0] : null,
      officePhone: officePhones && officePhones.length > 0 ? officePhones[0] : null,
      addresses: [...new Set(addresses)],
      url: cleanUrl(url && url.includes('facebook.com') ? null : url),
      success: true,
    })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      {
        error: 'Failed to scrape website',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
