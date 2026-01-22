import axios from 'axios'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'

// Regex patterns
export const PHONE_REGEX = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?![a-zA-Z0-9])/g

// Words that cannot be first names - common words, pronouns, verbs that appear after titles like "Pastor"
const INVALID_FIRST_NAMES = new Set([
  // Common words from user's list
  'pastor', 'our', 'and', 'on', 'join', 'students', 'goals', 'what', 'in', 'at',
  'of', 'to', 'leadership', 'teaches', 'assisting', 'awaiting', 'email', 'as',
  'where', 'events', 'newsletter', 'home', 'lives', 'during', 'facebook', 'vision',
  'meets', 'visit', 'orientation', 'god', 'news', 'because', 'learn', 'helped',
  'or', 'mission',
  // Pronouns (all forms)
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves', 'they', 'them', 'their', 'theirs', 'themselves',
  'who', 'whom', 'whose', 'which', 'what', 'this', 'that', 'these', 'those',
  'anyone', 'everyone', 'someone', 'no one', 'nobody', 'anybody', 'everybody', 'somebody',
  'anything', 'everything', 'something', 'nothing',
  // Common verbs (conjugated forms)
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'need', 'dare', 'ought', 'used',
  'get', 'gets', 'got', 'getting', 'gotten',
  'go', 'goes', 'went', 'going', 'gone',
  'come', 'comes', 'came', 'coming',
  'make', 'makes', 'made', 'making',
  'take', 'takes', 'took', 'taking', 'taken',
  'see', 'sees', 'saw', 'seeing', 'seen',
  'know', 'knows', 'knew', 'knowing', 'known',
  'think', 'thinks', 'thought', 'thinking',
  'give', 'gives', 'gave', 'giving', 'given',
  'find', 'finds', 'found', 'finding',
  'tell', 'tells', 'told', 'telling',
  'say', 'says', 'said', 'saying',
  'ask', 'asks', 'asked', 'asking',
  'use', 'uses', 'used', 'using',
  'try', 'tries', 'tried', 'trying',
  'leave', 'leaves', 'left', 'leaving',
  'call', 'calls', 'called', 'calling',
  'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting',
  'begin', 'begins', 'began', 'beginning', 'begun',
  'seem', 'seems', 'seemed', 'seeming',
  'help', 'helps', 'helped', 'helping',
  'show', 'shows', 'showed', 'showing', 'shown',
  'hear', 'hears', 'heard', 'hearing',
  'play', 'plays', 'played', 'playing',
  'run', 'runs', 'ran', 'running',
  'move', 'moves', 'moved', 'moving',
  'live', 'lived', 'living',
  'believe', 'believes', 'believed', 'believing',
  'hold', 'holds', 'held', 'holding',
  'bring', 'brings', 'brought', 'bringing',
  'happen', 'happens', 'happened', 'happening',
  'write', 'writes', 'wrote', 'writing', 'written',
  'provide', 'provides', 'provided', 'providing',
  'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing',
  'lose', 'loses', 'lost', 'losing',
  'pay', 'pays', 'paid', 'paying',
  'meet', 'meets', 'met', 'meeting',
  'include', 'includes', 'included', 'including',
  'continue', 'continues', 'continued', 'continuing',
  'set', 'sets', 'setting',
  'learn', 'learns', 'learned', 'learning',
  'change', 'changes', 'changed', 'changing',
  'lead', 'leads', 'led', 'leading',
  'understand', 'understands', 'understood', 'understanding',
  'watch', 'watches', 'watched', 'watching',
  'follow', 'follows', 'followed', 'following',
  'stop', 'stops', 'stopped', 'stopping',
  'create', 'creates', 'created', 'creating',
  'speak', 'speaks', 'spoke', 'speaking', 'spoken',
  'read', 'reads', 'reading',
  'spend', 'spends', 'spent', 'spending',
  'grow', 'grows', 'grew', 'growing', 'grown',
  'open', 'opens', 'opened', 'opening',
  'walk', 'walks', 'walked', 'walking',
  'win', 'wins', 'won', 'winning',
  'offer', 'offers', 'offered', 'offering',
  'remember', 'remembers', 'remembered', 'remembering',
  'love', 'loves', 'loved', 'loving',
  'consider', 'considers', 'considered', 'considering',
  'appear', 'appears', 'appeared', 'appearing',
  'buy', 'buys', 'bought', 'buying',
  'wait', 'waits', 'waited', 'waiting',
  'serve', 'serves', 'served', 'serving',
  'die', 'dies', 'died', 'dying',
  'send', 'sends', 'sent', 'sending',
  'expect', 'expects', 'expected', 'expecting',
  'build', 'builds', 'built', 'building',
  'stay', 'stays', 'stayed', 'staying',
  'fall', 'falls', 'fell', 'falling', 'fallen',
  'cut', 'cuts', 'cutting',
  'reach', 'reaches', 'reached', 'reaching',
  'kill', 'kills', 'killed', 'killing',
  'remain', 'remains', 'remained', 'remaining',
  // Articles and prepositions
  'the', 'a', 'an', 'about', 'above', 'across', 'after', 'against', 'along',
  'among', 'around', 'before', 'behind', 'below', 'beneath', 'beside', 'between',
  'beyond', 'but', 'by', 'down', 'during', 'except', 'for', 'from', 'inside',
  'into', 'near', 'off', 'onto', 'out', 'outside', 'over', 'past', 'since',
  'through', 'throughout', 'till', 'toward', 'towards', 'under', 'underneath',
  'until', 'unto', 'up', 'upon', 'with', 'within', 'without',
  // Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'whether', 'while', 'although', 'because', 'if', 'unless',
  'until', 'when', 'where', 'whereas', 'wherever', 'whether',
  // Common adjectives/adverbs
  'all', 'also', 'any', 'back', 'each', 'even', 'every', 'first', 'good',
  'great', 'here', 'high', 'just', 'last', 'little', 'long', 'many', 'more',
  'most', 'much', 'new', 'no', 'now', 'old', 'only', 'other', 'own', 'right',
  'same', 'small', 'some', 'still', 'such', 'then', 'there', 'very', 'well',
  'again', 'always', 'never', 'often', 'really', 'too', 'yes',
  // Common nouns that aren't names
  'group', 'life', 'part', 'people', 'place', 'point', 'thing', 'time', 'way',
  'work', 'world', 'year', 'day', 'week', 'month',
  // Church/ministry specific
  'church', 'ministry', 'service', 'services', 'worship', 'prayer', 'bible',
  'study', 'class', 'classes', 'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'morning', 'evening', 'night', 'weekly',
  'monthly', 'annual', 'youth', 'adult', 'children', 'kids', 'men', 'women',
  'family', 'families', 'community', 'welcome', 'connect',
  // Website/UI terms
  'click', 'info', 'information', 'staff', 'team', 'board', 'office',
  'address', 'phone', 'fax', 'hours', 'contact', 'view', 'download', 'submit',
  'subscribe', 'register', 'login', 'logout', 'search', 'menu', 'page', 'link',
])

// Validate that a name is likely a real person's name
function isValidPersonName(name: string): boolean {
  if (!name || name.length < 2) return false

  const words = name.trim().split(/\s+/)
  if (words.length < 2) return false // Need at least first and last name

  const firstName = words[0]
  const lastName = words[words.length - 1]

  // First name checks
  // 1. Must start with uppercase letter
  if (!/^[A-Z]/.test(firstName)) return false

  // 2. Must not be in the blocklist
  if (INVALID_FIRST_NAMES.has(firstName.toLowerCase())) return false

  // 3. Must be mostly lowercase after first letter (proper capitalization)
  // Allow for names like "McDonald" but reject "PASTOR" or "AND"
  if (firstName.length > 1) {
    const restOfName = firstName.slice(1)
    const uppercaseCount = (restOfName.match(/[A-Z]/g) || []).length
    // Allow 1 uppercase for names like "McDonald", but not all caps
    if (uppercaseCount > 1) return false
  }

  // Last name checks
  // 1. Must start with uppercase letter
  if (!/^[A-Z]/.test(lastName)) return false

  // 2. Must not be in the blocklist
  if (INVALID_FIRST_NAMES.has(lastName.toLowerCase())) return false

  // 3. Check for proper capitalization
  if (lastName.length > 1) {
    const restOfName = lastName.slice(1)
    const uppercaseCount = (restOfName.match(/[A-Z]/g) || []).length
    if (uppercaseCount > 1) return false
  }

  // Check middle names if present
  for (let i = 1; i < words.length - 1; i++) {
    const middleName = words[i]
    if (!/^[A-Z]/.test(middleName)) return false
    if (INVALID_FIRST_NAMES.has(middleName.toLowerCase())) return false
  }

  return true
}

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
    // Full address regex: Must start with street number and include state + zip
    const addressRegex =
      /\d{1,5}\s[A-Za-z0-9,.\s-]{5,100}\s(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b[\s,.]*\d{5}/gi
    const addresses = textContent.match(addressRegex) || []

    // Also look for addresses in structured elements (address tag, schema.org, common classes)
    const structuredAddresses: string[] = []

    // State abbreviations for validation
    const stateAbbrs = 'AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY'

    // Helper to check if text is just City, ST ZIP (not a full address)
    const isCityStateZipOnly = (text: string) => {
      // Pattern for "City, ST 12345" without a street number at start
      const cityStateZipPattern = new RegExp(`^[A-Za-z\\s]+,\\s*(${stateAbbrs})\\s*\\d{5}`, 'i')
      const startsWithStreetNum = /^\d{1,5}\s/.test(text)
      return cityStateZipPattern.test(text) && !startsWithStreetNum
    }

    // Look for <address> tags
    $('address').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      // Must have street number at start to be a full address
      if (text.length > 10 && text.length < 200 && /^\d{1,5}\s/.test(text)) {
        structuredAddresses.push(text)
      }
    })

    // Look for schema.org PostalAddress - this gives us properly structured data
    $('[itemprop="address"], [itemtype*="PostalAddress"]').each((_, el) => {
      const streetEl = $(el).find('[itemprop="streetAddress"]')
      const cityEl = $(el).find('[itemprop="addressLocality"]')
      const stateEl = $(el).find('[itemprop="addressRegion"]')
      const zipEl = $(el).find('[itemprop="postalCode"]')

      const street = streetEl.text().trim()
      const city = cityEl.text().trim()
      const state = stateEl.text().trim()
      const zip = zipEl.text().trim()

      // Build properly formatted address: "123 Main St, City, ST 12345"
      if (street && city && state) {
        const parts = [street, city, state + (zip ? ' ' + zip : '')]
        structuredAddresses.push(parts.join(', '))
      }
    })

    // Look for common address container classes
    $('.address, .location, .contact-address, [class*="address"], [class*="location"]').each((_, el) => {
      const $el = $(el)
      // Skip if it's a link or form element
      if ($el.is('a, input, form')) return

      const text = $el.text().replace(/\s+/g, ' ').trim()
      // Must have a zip code AND start with street number to be a full address
      // Skip if it's just "City, ST 12345"
      if (text.match(/\b\d{5}(?:-\d{4})?\b/) && /^\d{1,5}\s/.test(text) && text.length > 15 && text.length < 200) {
        structuredAddresses.push(text)
      }
    })

    // Combine and dedupe addresses, filtering out city/state/zip only entries
    const allAddresses = [...addresses, ...structuredAddresses]
    const cleanAddresses = allAddresses
      .map((a) => a.replace(/\s+/g, ' ').trim())
      .filter((a) => !isCityStateZipOnly(a)) // Skip city/state/zip only
      .filter((a, i, arr) => arr.indexOf(a) === i) // dedupe

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
      /(?:General\s+Manager)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
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
        if (name && name.length > 3 && name.split(' ').length >= 2 && isValidPersonName(name)) {
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
        if (name && name.length > 3 && name.split(' ').length >= 2 && isValidPersonName(name)) {
          if (!people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            people.push({ name, title: title || undefined })
          }
        }
      }
    }

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
        // Filter out obvious non-names using validation function
        if (isValidPersonName(name) && !people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
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
