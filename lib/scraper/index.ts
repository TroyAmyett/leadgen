import axios from 'axios'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'

// Regex patterns
export const PHONE_REGEX = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?![a-zA-Z0-9])/g

export interface ScrapeResult {
  emails: Array<{ email: string; score: number }>
  phones: string[]
  socials: string[]
  facebookUrl: string | null
  officeEmail: string | null
  officePhone: string | null
  addresses: string[]
  url: string | null
  success: boolean
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  emails?: string[]
  phones?: string[]
}

// Clean URL helper
export function cleanUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let clean = url.trim()
  try {
    if (clean.includes('%')) {
      clean = decodeURIComponent(clean)
    }
  } catch {
    // ignore decode errors
  }

  if (clean.startsWith('//')) clean = 'https:' + clean
  return clean.trim()
}

// Clean email helper
export function cleanEmail(e: string | null | undefined): string {
  if (!e) return ''
  let clean = e.trim()

  try {
    if (clean.includes('%')) {
      clean = decodeURIComponent(clean)
    }
  } catch {
    // ignore
  }

  clean = clean.replace(/^[^a-zA-Z0-9]+/, '').trim()

  // Strip phone fragments
  let last: string
  do {
    last = clean
    clean = clean.replace(/^\d+[-.]\d+/, '')
    clean = clean.replace(/^[^a-zA-Z0-9]+/, '')
  } while (clean !== last)

  return clean.toLowerCase()
}

// Search engine definitions
interface SearchEngine {
  name: string
  url: string
  parser: (data: string) => SearchResult[]
}

function createSearchEngines(query: string): SearchEngine[] {
  return [
    {
      name: 'Yahoo',
      url: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`,
      parser: (data: string) => {
        const $ = cheerio.load(data)
        const results: SearchResult[] = []
        $('.algo-sr, .dd.algo, .res, .ov-a').each((_, el) => {
          const linkEl = $(el).find('a').first()
          let url = linkEl.attr('href') || ''
          const title = linkEl.text().trim()
          const snippet = $(el).find('.compText, .compContext, .st, .d-ab').text().trim()

          if (url && title) {
            if (url.includes('r.search.yahoo.com')) {
              try {
                const urlObj = new URL(url)
                const pathParts = urlObj.pathname.split('/')
                const ruPart = pathParts.find((p) => p.startsWith('RU='))
                if (ruPart) url = decodeURIComponent(ruPart.substring(3))
              } catch {
                // ignore
              }
            }

            const isInternal =
              url.includes('search.yahoo.com') || url.includes('legal.yahoo.com')
            if (!isInternal && !url.includes('javascript:')) {
              results.push({ title, url, snippet })
            }
          }
        })
        return results
      },
    },
    {
      name: 'DuckDuckGo',
      url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      parser: (data: string) => {
        const $ = cheerio.load(data)
        const results: SearchResult[] = []
        $('.result').each((_, el) => {
          const linkEl = $(el).find('.result__a')
          const url = linkEl.attr('href') || ''
          const title = linkEl.text().trim()
          const snippet = $(el).find('.result__snippet').text().trim()

          if (url && !url.includes('duckduckgo.com') && title) {
            const finalUrl = url.startsWith('//') ? 'https:' + url : url
            if (finalUrl.startsWith('http')) {
              results.push({ title, url: finalUrl, snippet })
            }
          }
        })
        return results
      },
    },
    {
      name: 'Bing',
      url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      parser: (data: string) => {
        const $ = cheerio.load(data)
        const results: SearchResult[] = []
        $('.b_algo').each((_, el) => {
          const linkEl = $(el).find('h2 a, h3 a').first()
          const url = linkEl.attr('href') || ''
          const title = linkEl.text().trim()
          const snippet = $(el).find('.b_caption p, .b_snippet, .st').text().trim()

          if (url && !url.includes('bing.com') && title) {
            results.push({ title, url, snippet })
          }
        })
        return results
      },
    },
  ]
}

export async function runSearch(query: string): Promise<SearchResult[]> {
  const engines = createSearchEngines(query)

  for (const engine of engines) {
    try {
      const response = await axios.get(engine.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      })
      const results = engine.parser(response.data)
      if (results.length > 0) return results
    } catch {
      // Try next engine
    }
  }

  return []
}

interface PersonInfo {
  name: string
  title?: string
  email?: string
  phone?: string
}

interface PageScrapeResult {
  emails: string[]
  phones: string[]
  socials: string[]
  addresses: string[]
  officeEmails: string[]
  officePhones: string[]
  internalLinks: string[]
  people: PersonInfo[]
}

export async function scrapePage(targetUrl: string): Promise<PageScrapeResult> {
  try {
    let finalUrl = targetUrl
    let headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }

    // Facebook special handling
    if (targetUrl.includes('facebook.com')) {
      finalUrl = targetUrl
        .replace('www.facebook.com', 'mbasic.facebook.com')
        .replace('facebook.com', 'mbasic.facebook.com')
      headers = {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }

    const response = await axios.get(finalUrl, {
      headers,
      timeout: 20000,
    })
    const html = response.data
    const $ = cheerio.load(html)

    // Remove non-content elements
    $('script, style, iframe').remove()

    // Helper to extract text with proper spacing
    const getTextWithSpaces = (root: cheerio.Cheerio<AnyNode>): string => {
      let text = ''
      root.contents().each((_, el) => {
        if (el.type === 'text') {
          text += $(el).text()
        } else if (el.type === 'tag') {
          const tagName = el.name
          const isSpacingTag = [
            'div',
            'p',
            'br',
            'li',
            'tr',
            'footer',
            'header',
            'h1',
            'h2',
            'h3',
            'nav',
            'section',
            'span',
            'a',
            'td',
            'th',
            'strong',
            'em',
            'b',
            'i',
          ].includes(tagName)

          if (isSpacingTag) text += ' '
          text += getTextWithSpaces($(el))
          if (isSpacingTag) text += ' '
        }
      })
      return text
    }

    const textContent = getTextWithSpaces($('body'))

    // Email extraction
    const rawEmails = textContent.match(EMAIL_REGEX) || []
    const emails = rawEmails.map(cleanEmail).filter(Boolean)

    // Mailto links
    const mailtoLinks: string[] = []
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        const mail = cleanEmail(href.replace('mailto:', '').split('?')[0])
        if (mail) mailtoLinks.push(mail)
      }
    })

    // Address extraction
    const addressRegex =
      /\d{1,5}\s[A-Za-z0-9,.\s-]{5,100}\s(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b[\s,.]*\d{5}/gi
    const addresses = textContent.match(addressRegex) || []
    const cleanAddresses = addresses.map((a) => a.replace(/\s+/g, ' ').trim())

    // Phone extraction
    const phones = textContent.match(PHONE_REGEX) || []

    // Social media links
    const socials: string[] = []
    $(
      'a[href*="facebook.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="tiktok.com"]'
    ).each((_, el) => {
      const href = $(el).attr('href')
      if (href) socials.push(href)
    })

    // Footer-specific extraction
    const footer = $('footer, .footer, [id*="footer"], [class*="footer"]').first()
    let footerEmails: string[] = []
    let footerPhones: string[] = []

    if (footer.length) {
      const footerText = getTextWithSpaces(footer)
      footerEmails =
        footerText
          .toLowerCase()
          .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g) || []
      footerPhones = footerText.match(PHONE_REGEX) || []

      // Check mailto links in footer
      footer.find('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href')
        if (href) {
          const mail = cleanEmail(href.replace('mailto:', '').split('?')[0])
          if (mail && !footerEmails.includes(mail)) footerEmails.push(mail)
        }
      })

      footerEmails = footerEmails.map(cleanEmail).filter(Boolean)
    }

    // Internal links
    let hostname = ''
    try {
      hostname = new URL(finalUrl).hostname
    } catch {
      // ignore
    }

    const internalLinks: string[] = []
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && (href.startsWith('/') || (hostname && href.includes(hostname)))) {
        try {
          const absolute = new URL(href, finalUrl).href
          if (absolute !== finalUrl) internalLinks.push(absolute)
        } catch {
          // ignore
        }
      }
    })

    // Facebook About page fallback
    let fbAdditionalEmails: string[] = []
    if (targetUrl.includes('facebook.com')) {
      try {
        const aboutUrl = finalUrl.replace(/(\/)?$/, '/about')
        const aboutResp = await axios.get(aboutUrl, {
          headers,
          timeout: 20000,
        })
        const $about = cheerio.load(aboutResp.data)
        const aboutText = getTextWithSpaces($about('body'))
        const aboutRaw = aboutText.match(EMAIL_REGEX) || []
        fbAdditionalEmails = aboutRaw.map(cleanEmail).filter(Boolean)
      } catch {
        // ignore
      }
    }

    // Extract people (names and titles)
    const people: PersonInfo[] = []

    // Title patterns - industry agnostic but includes church-specific ones
    const titlePatterns = [
      // Church/Religious
      /(?:Senior\s+)?Pastor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Lead\s+)?Minister\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Rev(?:erend)?\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Father|Fr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Deacon|Elder)\s+([A-Z][a-z]+(?:\s+[A-z]+){1,2})/gi,
      // Business titles
      /(?:CEO|President|Owner|Founder)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Director|Manager|Coordinator)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Office\s+Manager)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
      /(?:Contact|General\s+Manager)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
    ]

    // Reverse patterns: "Name, Title" or "Name - Title"
    const reverseTitlePatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s*[,\-–]\s*((?:Senior\s+)?Pastor|(?:Lead\s+)?Minister|Director|Manager|Coordinator|CEO|President|Owner|Office\s+Manager)/gi,
    ]

    // Extract from text content
    for (const pattern of titlePatterns) {
      let match
      while ((match = pattern.exec(textContent)) !== null) {
        const name = match[1]?.trim()
        // Extract the title from the pattern (everything before the capture group)
        const fullMatch = match[0]
        const title = fullMatch.replace(name, '').replace(/[:\-\s]+$/, '').trim()
        if (name && name.length > 3 && name.split(' ').length >= 2) {
          // Avoid duplicates
          if (!people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            people.push({ name, title: title || undefined })
          }
        }
      }
    }

    // Try reverse patterns
    for (const pattern of reverseTitlePatterns) {
      let match
      while ((match = pattern.exec(textContent)) !== null) {
        const name = match[1]?.trim()
        const title = match[2]?.trim()
        if (name && name.length > 3 && name.split(' ').length >= 2) {
          if (!people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            people.push({ name, title: title || undefined })
          }
        }
      }
    }

    // Look for structured contact sections
    $('*').each((_, el) => {
      const $el = $(el)
      const elText = $el.text().trim()

      // Look for "Contact: Name" patterns
      const contactMatch = elText.match(/Contact(?:\s+Person)?[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i)
      if (contactMatch) {
        const name = contactMatch[1].trim()
        if (name && name.length > 3 && !people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
          people.push({ name, title: 'Contact' })
        }
      }
    })

    // Look for staff/team cards (common patterns in websites)
    $('.staff, .team, .leadership, .our-team, .team-member, .staff-member, [class*="staff"], [class*="team-member"]').each((_, el) => {
      const $el = $(el)
      // Look for name in headings or strong tags
      const nameEl = $el.find('h2, h3, h4, h5, strong, .name, .title, [class*="name"]').first()
      const name = nameEl.text().trim()

      // Look for title/position
      const titleEl = $el.find('.position, .role, .job-title, [class*="position"], [class*="role"], [class*="title"]').first()
      let title = titleEl.text().trim()

      // If title element is same as name element, look elsewhere
      if (title === name) {
        title = $el.find('p, span').not(nameEl).first().text().trim()
      }

      if (name && name.length > 3 && name.split(' ').length >= 2 && name.length < 50) {
        // Filter out obvious non-names
        const isLikelyName = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(name)
        if (isLikelyName && !people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
          people.push({
            name,
            title: title && title.length < 50 ? title : undefined
          })
        }
      }
    })

    return {
      emails: [...new Set([...emails, ...mailtoLinks, ...fbAdditionalEmails])],
      phones: [...new Set(phones)],
      socials: [...new Set(socials)],
      addresses: cleanAddresses,
      officeEmails: [...new Set(footerEmails)],
      officePhones: [...new Set(footerPhones)],
      internalLinks: [...new Set(internalLinks)],
      people,
    }
  } catch (error) {
    console.error(`Error scraping ${targetUrl}:`, error)
    return {
      emails: [],
      phones: [],
      socials: [],
      internalLinks: [],
      officeEmails: [],
      officePhones: [],
      addresses: [],
      people: [],
    }
  }
}

export async function findWebPresence(
  query: string
): Promise<{ website: string | null; facebook: string | null }> {
  try {
    console.log(`Fallback Search Query: ${query}`)
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
    const res = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      },
    })
    const $ = cheerio.load(res.data)

    let foundWebsite: string | null = null
    let foundFacebook: string | null = null

    const directoryDomains = [
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'twitter.com',
      'yelp.com',
      'yellowpages.com',
      'mapquest.com',
      'tripadvisor.com',
      'pinterest.com',
      'youtube.com',
      'tiktok.com',
      'bbb.org',
      'manta.com',
    ]

    $('.algo-sr, .dd.algo, .res, .ov-a').each((_, el) => {
      const linkEl = $(el).find('a').first()
      let link = linkEl.attr('href') || ''

      if (link) {
        if (link.includes('r.search.yahoo.com')) {
          try {
            const urlObj = new URL(link)
            const pathParts = urlObj.pathname.split('/')
            const ruPart = pathParts.find((p) => p.startsWith('RU='))
            if (ruPart) link = decodeURIComponent(ruPart.substring(3))
          } catch {
            // ignore
          }
        }

        if (!link.startsWith('http')) return

        // Check Facebook
        if (
          link.includes('facebook.com') &&
          !link.includes('/sharer') &&
          !link.includes('/login')
        ) {
          if (!foundFacebook) foundFacebook = link
        }

        // Identify potential official website
        const isDirectory = directoryDomains.some((d) => link.includes(d))
        if (!foundWebsite && !isDirectory) {
          foundWebsite = link
        }
      }
    })

    return { website: foundWebsite, facebook: foundFacebook }
  } catch (error) {
    console.error(`Fallback search error:`, error)
    return { website: null, facebook: null }
  }
}
