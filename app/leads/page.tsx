'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useLeadsStore, LocalLead } from '@/stores/leadsStore'
import { LeadsTable } from '@/components/LeadsTable'
import { LeadFormModal } from '@/components/LeadFormModal'
import { EnrichmentProgress } from '@/components/EnrichmentProgress'

const ITEMS_PER_PAGE = 10
const DEMO_SCROLL_VISIBLE_ROWS = 9 // Number of rows visible during demo scroll

// Filter local leads
function getFilteredLocalLeads(
  leads: LocalLead[],
  searchQuery: string,
  statusFilter: string | null,
  enrichmentFilter: string | null
): LocalLead[] {
  return leads.filter((lead) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchFields = [
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.company,
        lead.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (!searchFields.includes(query)) {
        return false
      }
    }

    // Status filter
    if (statusFilter && lead.status !== statusFilter) {
      return false
    }

    // Enrichment filter
    if (enrichmentFilter && lead.enrichment_status !== enrichmentFilter) {
      return false
    }

    return true
  })
}

// Threshold for auto-export after bulk enrichment
const AUTO_EXPORT_THRESHOLD = 10

export default function LeadsPage() {
  const router = useRouter()
  const {
    localLeads,
    importedFileName,
    selectedLeadIds,
    searchQuery,
    statusFilter,
    enrichmentFilter,
    setSearchQuery,
    setStatusFilter,
    setEnrichmentFilter,
    selectAllLeads,
    clearSelection,
    clearLocalLeads,
    updateLocalLead,
    toggleLeadSelection,
  } = useLeadsStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0 })
  const [lastEnrichedId, setLastEnrichedId] = useState<string | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Get filtered leads from local store
  const filteredLeads = getFilteredLocalLeads(localLeads, searchQuery, statusFilter, enrichmentFilter)

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, enrichmentFilter])

  // Scroll to show last enriched lead during enrichment
  const scrollToLead = useCallback((leadId: string) => {
    // Find the lead's index in the full list
    const leadIndex = localLeads.findIndex(l => l.id === leadId)
    if (leadIndex === -1) return

    // Calculate which page this lead is on
    const targetPage = Math.floor(leadIndex / ITEMS_PER_PAGE) + 1

    // If we're enriching, jump to the page showing this lead
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage)
    }

    // Smooth scroll the row into view after a short delay for page change
    setTimeout(() => {
      const row = document.querySelector(`[data-lead-id="${leadId}"]`)
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
  }, [localLeads, currentPage])

  // Auto-scroll to last enriched lead during enrichment
  useEffect(() => {
    if (isEnriching && lastEnrichedId) {
      scrollToLead(lastEnrichedId)
    }
  }, [isEnriching, lastEnrichedId, scrollToLead])

  // State abbreviation to full name mapping
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia'
  }

  // Reverse mapping: full name to abbreviation
  const stateAbbreviations: Record<string, string> = Object.entries(stateNames).reduce((acc, [abbr, name]) => {
    acc[name.toLowerCase()] = abbr
    return acc
  }, {} as Record<string, string>)

  // Detect phone format from a sample phone number
  // Returns: 'parentheses' for (###) ###-####, 'dashes' for ###-###-####, 'dots' for ###.###.####, 'plain' for ##########
  const detectPhoneFormat = (phone: string | null | undefined): 'parentheses' | 'dashes' | 'dots' | 'plain' => {
    if (!phone) return 'parentheses' // default
    if (phone.includes('(')) return 'parentheses'
    if (phone.includes('.')) return 'dots'
    if (phone.includes('-')) return 'dashes'
    return 'plain'
  }

  // Format phone number according to detected format
  const formatPhoneAs = (phone: string | null | undefined, format: 'parentheses' | 'dashes' | 'dots' | 'plain'): string => {
    if (!phone) return ''
    // Remove all non-digits
    let digits = phone.replace(/\D/g, '')

    // Strip leading 1 (US country code)
    if (digits.length >= 11 && digits.startsWith('1')) {
      digits = digits.slice(1)
    }

    // Need at least 10 digits for a valid US number
    if (digits.length < 10) {
      return phone // Return original if too short
    }

    let main = ''
    switch (format) {
      case 'parentheses':
        main = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
        break
      case 'dashes':
        main = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
        break
      case 'dots':
        main = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 10)}`
        break
      case 'plain':
        main = digits.slice(0, 10)
        break
    }

    // Any digits beyond 10 are the extension
    if (digits.length > 10) {
      const ext = digits.slice(10)
      return `${main},${ext}`
    }

    return main
  }

  // Detect state format: 'abbr' for 2-letter, 'full' for full name
  const detectStateFormat = (state: string | null | undefined): 'abbr' | 'full' => {
    if (!state) return 'abbr' // default
    const trimmed = state.trim()
    if (trimmed.length === 2) return 'abbr'
    if (trimmed.length > 2) return 'full'
    return 'abbr'
  }

  // Format state according to detected format
  const formatStateAs = (state: string | null | undefined, format: 'abbr' | 'full'): string => {
    if (!state) return ''
    const trimmed = state.trim()

    if (format === 'abbr') {
      // If already abbreviation, return uppercase
      if (trimmed.length === 2) return trimmed.toUpperCase()
      // Convert full name to abbreviation
      const abbr = stateAbbreviations[trimmed.toLowerCase()]
      return abbr || trimmed
    } else {
      // If already full name, return as-is with proper case
      if (trimmed.length > 2) {
        // Proper case the name
        return trimmed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }
      // Convert abbreviation to full name
      const fullName = stateNames[trimmed.toUpperCase()]
      return fullName || trimmed
    }
  }

  // Legacy function for backwards compatibility
  const formatUSPhone = (phone: string | null | undefined): string => {
    return formatPhoneAs(phone, 'parentheses')
  }

  // Extract social URL by platform
  const extractSocialByPlatform = (socials: string[], platform: string): string => {
    const patterns: Record<string, string[]> = {
      facebook: ['facebook.com'],
      linkedin: ['linkedin.com'],
      instagram: ['instagram.com'],
      twitter: ['twitter.com', 'x.com'],
      youtube: ['youtube.com'],
      tiktok: ['tiktok.com'],
    }
    const urls = patterns[platform] || []
    const match = socials.find(s => urls.some(u => s.toLowerCase().includes(u)))
    return match || ''
  }

  // Export function that can be called with specific leads or defaults to filtered leads
  const exportLeads = (leadsToExport: LocalLead[], filename = 'leads_export.csv') => {
    if (leadsToExport.length === 0) return

    // Get original column order from the first lead's original_data
    const firstLeadWithData = leadsToExport.find((lead) => lead.original_data)
    const originalColumns: string[] = firstLeadWithData?.original_data
      ? Object.keys(firstLeadWithData.original_data)
      : []

    // Also collect any additional columns from other leads (in case of mixed imports)
    const allOriginalKeys = new Set<string>(originalColumns)
    leadsToExport.forEach((lead) => {
      if (lead.original_data) {
        Object.keys(lead.original_data).forEach((key) => allOriginalKeys.add(key))
      }
    })
    // Add any extra keys not in the first lead's data (preserving order, extras at end)
    allOriginalKeys.forEach((key) => {
      if (!originalColumns.includes(key)) {
        originalColumns.push(key)
      }
    })

    // Detect address field patterns in original CSV
    const lowerOriginalColumns = originalColumns.map(c => c.toLowerCase())
    const hasAddress1 = lowerOriginalColumns.some(c => c === 'address1' || c === 'address 1')
    const hasAddress2 = lowerOriginalColumns.some(c => c === 'address2' || c === 'address 2')
    const hasStreet1 = lowerOriginalColumns.some(c => c === 'street1' || c === 'street 1')
    const hasStreet2 = lowerOriginalColumns.some(c => c === 'street2' || c === 'street 2')
    const hasSplitAddress = (hasAddress1 && hasAddress2) || (hasStreet1 && hasStreet2)

    // Find the exact address field names used in the original CSV
    const address1FieldName = originalColumns.find(c => c.toLowerCase() === 'address1' || c.toLowerCase() === 'address 1') || 'Address 1'
    const address2FieldName = originalColumns.find(c => c.toLowerCase() === 'address2' || c.toLowerCase() === 'address 2') || 'Address 2'

    // Detect phone format from first lead with a phone number
    const firstLeadWithPhone = leadsToExport.find(lead => lead.phone || lead.original_data?.Phone || lead.original_data?.phone)
    const originalPhone = firstLeadWithPhone?.original_data?.Phone || firstLeadWithPhone?.original_data?.phone || firstLeadWithPhone?.phone
    const detectedPhoneFormat = detectPhoneFormat(originalPhone as string)

    // Detect state format from first lead with a state
    const firstLeadWithState = leadsToExport.find(lead => lead.state || lead.original_data?.State || lead.original_data?.state)
    const originalState = firstLeadWithState?.original_data?.State || firstLeadWithState?.original_data?.state || firstLeadWithState?.state
    const detectedStateFormat = detectStateFormat(originalState as string)

    // Enriched field names (clean names, no prefix)
    // Use Street if no split address fields, otherwise we'll populate Address1/2 or Street1/2
    const enrichedFieldNames = [
      'Email',
      'Phone',
      'Website',
      'Facebook',
      'LinkedIn',
      'Instagram',
      'Twitter',
      'YouTube',
      'TikTok',
      'Other_Socials',
      'Office_Email',
      'Office_Phone',
      ...(hasSplitAddress ? [] : ['Street']),
      'City',
      'State',
      'Postal_Code',
      'Alt_Street',
      'Alt_City',
      'Alt_State',
      'Alt_Postal_Code',
      'First_Name',
      'Last_Name',
      'Title',
      'Enrichment_Status',
    ]

    // Only add enriched fields that don't already exist in original columns (case-insensitive check)
    const newFields = enrichedFieldNames.filter(f => !lowerOriginalColumns.includes(f.toLowerCase().replace('_', ' ')) && !lowerOriginalColumns.includes(f.toLowerCase()))
    const headers = [...originalColumns, ...newFields]

    // Build rows preserving original data and adding/updating enriched data
    const rows = leadsToExport.map((lead) => {
      const row: string[] = []
      const enrichData = (lead.enrichment_data || {}) as Record<string, unknown>

      // Collect all socials
      const allSocials: string[] = []
      if (enrichData.facebookUrl) allSocials.push(enrichData.facebookUrl as string)
      if (enrichData.socials && Array.isArray(enrichData.socials)) {
        allSocials.push(...(enrichData.socials as string[]))
      }
      if (lead.linkedin_url) allSocials.push(lead.linkedin_url)
      const uniqueSocials = [...new Set(allSocials)]

      // Extract each platform
      const facebook = extractSocialByPlatform(uniqueSocials, 'facebook') || (enrichData.facebookUrl as string) || ''
      const linkedin = extractSocialByPlatform(uniqueSocials, 'linkedin') || lead.linkedin_url || ''
      const instagram = extractSocialByPlatform(uniqueSocials, 'instagram')
      const twitter = extractSocialByPlatform(uniqueSocials, 'twitter')
      const youtube = extractSocialByPlatform(uniqueSocials, 'youtube')
      const tiktok = extractSocialByPlatform(uniqueSocials, 'tiktok')
      const knownPlatforms = ['facebook.com', 'linkedin.com', 'instagram.com', 'twitter.com', 'x.com', 'youtube.com', 'tiktok.com']
      const otherSocials = uniqueSocials.filter(s => !knownPlatforms.some(p => s.toLowerCase().includes(p)))

      // Format phones using detected format from input data
      const enrichedPhone = formatPhoneAs((enrichData.phones as string[])?.[0] || lead.phone, detectedPhoneFormat)
      const officePhone = formatPhoneAs(enrichData.officePhone as string, detectedPhoneFormat)

      // Get original address from lead fields
      const originalStreet = lead.address || ''
      const originalCity = lead.city || ''
      const originalState = lead.state || ''
      const originalPostalCode = lead.postal_code || ''

      // Parse enriched addresses
      const enrichedAddresses = (enrichData.addresses as string[]) || []

      // Helper to parse address string into components
      const parseAddress = (fullAddress: string) => {
        const cleaned = fullAddress.replace(/\s+/g, ' ').trim()
        // Try format: "123 Main St, City, ST 12345" (two commas)
        const match = cleaned.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i)
        if (match) {
          return {
            street: match[1].trim(),
            city: match[2].trim(),
            state: match[3].trim().toUpperCase(),
            postalCode: match[4].trim()
          }
        }
        // Try format: "123 Main St, City, ST" (two commas, no zip)
        const match2 = cleaned.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})$/i)
        if (match2) {
          return {
            street: match2[1].trim(),
            city: match2[2].trim(),
            state: match2[3].trim().toUpperCase(),
            postalCode: ''
          }
        }
        // Try format: "400 Lakeview Drive Coral Springs, FL 33071" (one comma before state)
        // Pattern: Street City, ST ZIP - need to find where street ends and city begins
        const match3 = cleaned.match(/^(.+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i)
        if (match3) {
          const streetAndCity = match3[1].trim()
          const state = match3[2].trim().toUpperCase()
          const postalCode = match3[3].trim()

          // Find street suffix to split street from city
          // Includes optional suite/unit number after suffix: "123 Main St STE 100 City" or "123 Main Dr Unit 5 City"
          // Suite patterns: STE, Suite, Unit, Apt, #, Bldg followed by alphanumeric
          const streetSuffixPattern = /^(.+?\s+(?:St(?:reet)?|Dr(?:ive)?|Ave(?:nue)?|Blvd|Boulevard|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Cir(?:cle)?|Ter(?:race)?|Hwy|Highway|Pkwy|Parkway|Trl|Trail)\.?(?:\s+(?:STE|Ste|Suite|Unit|Apt|Apartment|Bldg|Building|#)\s*[A-Za-z0-9-]+)?)\s+(.+)$/i
          const suffixMatch = streetAndCity.match(streetSuffixPattern)

          if (suffixMatch) {
            return {
              street: suffixMatch[1].trim(),
              city: suffixMatch[2].trim(),
              state,
              postalCode
            }
          }
          // No suffix found, treat whole thing as street
          return { street: streetAndCity, city: '', state, postalCode }
        }
        // Try format: "Street City, ST" (one comma, no zip)
        const match4 = cleaned.match(/^(.+),\s*([A-Z]{2})$/i)
        if (match4) {
          const streetAndCity = match4[1].trim()
          const state = match4[2].trim().toUpperCase()

          const streetSuffixPattern = /^(.+?\s+(?:St(?:reet)?|Dr(?:ive)?|Ave(?:nue)?|Blvd|Boulevard|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Cir(?:cle)?|Ter(?:race)?|Hwy|Highway|Pkwy|Parkway|Trl|Trail)\.?(?:\s+(?:STE|Ste|Suite|Unit|Apt|Apartment|Bldg|Building|#)\s*[A-Za-z0-9-]+)?)\s+(.+)$/i
          const suffixMatch = streetAndCity.match(streetSuffixPattern)

          if (suffixMatch) {
            return {
              street: suffixMatch[1].trim(),
              city: suffixMatch[2].trim(),
              state,
              postalCode: ''
            }
          }
          return { street: streetAndCity, city: '', state, postalCode: '' }
        }
        // Fallback: just street
        return { street: cleaned, city: '', state: '', postalCode: '' }
      }

      // Parse first enriched address if available
      let enrichedStreet = ''
      let enrichedCity = ''
      let enrichedState = ''
      let enrichedPostalCode = ''

      if (enrichedAddresses.length > 0) {
        const parsed = parseAddress(enrichedAddresses[0])
        enrichedStreet = parsed.street
        enrichedCity = parsed.city
        enrichedState = parsed.state
        enrichedPostalCode = parsed.postalCode
      }

      // Determine if enriched address is truly different from original
      // Use "high correlation match": if street number and first word match, consider them the same
      const getStreetNumberAndFirstWord = (street: string) => {
        const normalized = street.toLowerCase().trim()
        const match = normalized.match(/^(\d+)\s+(\w+)/)
        return match ? { num: match[1], word: match[2] } : null
      }

      const originalParts = getStreetNumberAndFirstWord(originalStreet)
      const enrichedParts = getStreetNumberAndFirstWord(enrichedStreet)

      // High correlation: street number + first word match = same address
      const isHighCorrelation = originalParts && enrichedParts &&
        originalParts.num === enrichedParts.num &&
        originalParts.word === enrichedParts.word

      // Also check if normalized full address matches
      const normalizeForCompare = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
      const originalNormalized = normalizeForCompare(originalStreet + originalCity + originalState)
      const enrichedNormalized = normalizeForCompare(enrichedStreet + enrichedCity + enrichedState)
      const exactMatch = originalNormalized === enrichedNormalized

      // Address is only different if not high correlation AND not exact match
      const addressIsDifferent = enrichedStreet && originalStreet && !isHighCorrelation && !exactMatch

      // Final address values: use original if present, otherwise enriched
      // Only override with enriched if original is empty
      let street1 = originalStreet || enrichedStreet
      const street2 = '' // We don't typically get street2 from scraping
      let city = originalCity || enrichedCity
      let state = originalState || enrichedState
      let postalCode = originalPostalCode || enrichedPostalCode

      // Alternate address: only if enriched is truly different AND original exists
      let altStreet = ''
      let altCity = ''
      let altState = ''
      let altPostalCode = ''

      if (addressIsDifferent) {
        altStreet = enrichedStreet
        altCity = enrichedCity
        altState = enrichedState
        altPostalCode = enrichedPostalCode
      }

      // Combined street for non-split address CSV (just street, NOT city/state/zip)
      const combinedStreet = street1

      // Extract contact person from enrichment data
      const people = (enrichData.people as Array<{name: string; title?: string}>) || []
      const primaryContact = people.length > 0 ? people[0] : null
      // Use enriched name if lead doesn't have one
      const scrapedName = primaryContact?.name || ''
      const scrapedNameParts = scrapedName.split(' ')
      const scrapedFirstName = scrapedNameParts[0] || ''
      const scrapedLastName = scrapedNameParts.slice(1).join(' ') || ''
      // Only use scraped name if lead doesn't already have one
      const firstName = lead.first_name || scrapedFirstName
      const lastName = lead.last_name || scrapedLastName
      const title = primaryContact?.title || lead.title || ''

      // Map of enriched field values
      const enrichedValues: Record<string, string> = {
        email: (enrichData.emails as Array<{email: string}>)?.[0]?.email || lead.email || '',
        phone: enrichedPhone,
        website: (enrichData.url as string) || lead.website || '',
        facebook: facebook,
        linkedin: linkedin,
        instagram: instagram,
        twitter: twitter,
        youtube: youtube,
        tiktok: tiktok,
        other_socials: otherSocials.join('; '),
        office_email: (enrichData.officeEmail as string) || '',
        office_phone: officePhone,
        // Address fields - support various naming conventions (street only, NOT city/state/zip in street)
        street: combinedStreet,
        address: street1,
        address1: street1,
        'address 1': street1,
        address2: street2,
        'address 2': street2,
        street1: street1,
        'street 1': street1,
        street2: street2,
        'street 2': street2,
        city: city,
        state: formatStateAs(state, detectedStateFormat),
        postal_code: postalCode,
        postalcode: postalCode,
        zip: postalCode,
        zipcode: postalCode,
        'zip code': postalCode,
        // Alternate address (only populated if different from original)
        alt_street: altStreet,
        alt_city: altCity,
        alt_state: altState ? formatStateAs(altState, detectedStateFormat) : '',
        alt_postal_code: altPostalCode,
        // Name and title - support various naming conventions
        first_name: firstName,
        'first name': firstName,
        firstname: firstName,
        last_name: lastName,
        'last name': lastName,
        lastname: lastName,
        title: title,
        'job title': title,
        position: title,
        enrichment_status: lead.enrichment_status,
      }

      // Add original data columns - if column matches an enriched field, use enriched value
      originalColumns.forEach((key) => {
        const lowerKey = key.toLowerCase()
        if (enrichedValues[lowerKey] !== undefined) {
          // Use enriched value for this column
          row.push(enrichedValues[lowerKey])
        } else {
          const value = lead.original_data?.[key]
          row.push(value !== undefined && value !== null ? String(value) : '')
        }
      })

      // Add new enriched fields that weren't in original columns
      newFields.forEach((field) => {
        const lowerField = field.toLowerCase()
        row.push(enrichedValues[lowerField] || '')
      })

      return row
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Enrich a single lead - returns the result for batch processing
  const enrichSingleLead = async (lead: LocalLead): Promise<{ id: string; success: boolean }> => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: lead.website || '',
          firstName: lead.first_name,
          lastName: lead.last_name,
          company: lead.company,
          city: lead.city,
          state: lead.state,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        updateLocalLead(lead.id, {
          enrichment_status: 'enriched',
          enrichment_data: data,
          email: data.emails?.[0]?.email || lead.email,
          phone: data.phones?.[0] || lead.phone,
          website: data.url || lead.website,
        })
        // Track last enriched for scroll effect
        setLastEnrichedId(lead.id)
        return { id: lead.id, success: true }
      } else {
        updateLocalLead(lead.id, { enrichment_status: 'failed' })
        setLastEnrichedId(lead.id)
        return { id: lead.id, success: false }
      }
    } catch (err) {
      console.error('Enrichment error:', err)
      updateLocalLead(lead.id, { enrichment_status: 'failed' })
      setLastEnrichedId(lead.id)
      return { id: lead.id, success: false }
    }
  }

  const handleEnrichSelected = async () => {
    if (selectedLeadIds.length === 0) return

    const isBulkEnrichment = selectedLeadIds.length >= AUTO_EXPORT_THRESHOLD
    setIsEnriching(true)

    // Get leads to enrich - skip already enriched ones
    const leadsToEnrich = localLeads.filter(
      (l) => selectedLeadIds.includes(l.id) && l.enrichment_status !== 'enriched'
    )

    // If all selected leads are already enriched, just exit
    if (leadsToEnrich.length === 0) {
      setIsEnriching(false)
      clearSelection()
      return
    }

    setEnrichmentProgress({ current: 0, total: leadsToEnrich.length })

    // Process in parallel batches of 4 for speed
    const BATCH_SIZE = 4
    const BATCH_DELAY = 500 // ms between batches (much shorter than per-lead delay)
    let completed = 0

    for (let i = 0; i < leadsToEnrich.length; i += BATCH_SIZE) {
      const batch = leadsToEnrich.slice(i, i + BATCH_SIZE)

      // Mark batch as "enriching" for UI feedback
      batch.forEach(lead => {
        updateLocalLead(lead.id, { enrichment_status: 'enriching' })
      })

      // Process batch in parallel
      const results = await Promise.all(batch.map(lead => enrichSingleLead(lead)))

      completed += results.length
      setEnrichmentProgress({ current: completed, total: leadsToEnrich.length })

      // Small delay between batches to avoid overwhelming the server
      if (i + BATCH_SIZE < leadsToEnrich.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY))
      }
    }

    setIsEnriching(false)
    clearSelection()

    // Auto-export if this was a bulk enrichment
    if (isBulkEnrichment) {
      // Small delay to ensure state is updated before export
      setTimeout(() => {
        // Get fresh state from store - don't use stale closure
        const freshState = useLeadsStore.getState()
        const freshLeads = freshState.localLeads
        const baseName = freshState.importedFileName || 'leads'
        exportLeads(freshLeads, `${baseName}-enriched.csv`)
      }, 500)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedLeadIds.length === 0) return

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedLeadIds.length} lead(s)?`
      )
    ) {
      // For local leads, we just clear them all for now
      // In a real app, you'd filter out just the selected ones
      clearLocalLeads()
    }
  }

  const handleExport = () => {
    const baseName = importedFileName || 'leads'
    exportLeads(filteredLeads, `${baseName}-enriched.csv`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fl-text-primary">Leads</h1>
          <p className="text-fl-text-secondary mt-1">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            {localLeads.length !== filteredLeads.length && ` (filtered from ${localLeads.length})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Lead
          </button>
          <button
            onClick={() => router.push('/import')}
            className="btn-secondary"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Enrichment Progress */}
      {isEnriching && (
        <EnrichmentProgress
          current={enrichmentProgress.current}
          total={enrichmentProgress.total}
        />
      )}

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fl-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="input pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${
              showFilters ? 'bg-fl-primary/10 border-fl-primary' : ''
            }`}
          >
            <Filter size={16} />
            Filters
          </button>

          {/* Actions */}
          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnrichSelected}
                disabled={isEnriching}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles size={16} />
                Enrich ({selectedLeadIds.length})
              </button>
              <button
                onClick={handleDeleteSelected}
                className="btn-destructive flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={filteredLeads.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-fl-border"
          >
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="label">Status</label>
                <select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || null)}
                  className="input w-40"
                >
                  <option value="">All</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="disqualified">Disqualified</option>
                </select>
              </div>
              <div>
                <label className="label">Enrichment</label>
                <select
                  value={enrichmentFilter || ''}
                  onChange={(e) => setEnrichmentFilter(e.target.value || null)}
                  className="input w-40"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="enriched">Enriched</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Leads Table */}
      <LeadsTable
        leads={paginatedLeads}
        selectedIds={selectedLeadIds}
        onSelectAll={selectAllLeads}
        onClearSelection={clearSelection}
        allSelected={
          filteredLeads.length > 0 &&
          selectedLeadIds.length === filteredLeads.length
        }
        lastEnrichedId={isEnriching ? lastEnrichedId : null}
        isEnriching={isEnriching}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-fl-text-muted">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} of{' '}
            {filteredLeads.length} leads
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary p-2"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-fl-text-secondary px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary p-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <LeadFormModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}
