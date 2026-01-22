'use client'

import { useEffect, useState } from 'react'
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

  // Format phone number to US format (xxx) xxx-xxxx
  const formatUSPhone = (phone: string | null | undefined): string => {
    if (!phone) return ''
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    // Handle 10-digit numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    // Handle 11-digit numbers starting with 1
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    // Return original if doesn't match expected format
    return phone
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

      // Format phones in US format
      const enrichedPhone = formatUSPhone((enrichData.phones as string[])?.[0] || lead.phone)
      const officePhone = formatUSPhone(enrichData.officePhone as string)

      // Get address components - prefer enriched, fallback to lead fields
      const enrichedAddresses = (enrichData.addresses as string[]) || []
      let street1 = ''
      let street2 = ''
      let city = ''
      let state = ''
      let postalCode = ''

      if (enrichedAddresses.length > 0) {
        // Parse enriched address - typically format: "123 Main St, City, ST 12345"
        const fullAddress = enrichedAddresses[0].replace(/\s+/g, ' ').trim()
        // Try to parse into components
        const addressMatch = fullAddress.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i)
        if (addressMatch) {
          street1 = addressMatch[1].trim()
          city = addressMatch[2].trim()
          state = addressMatch[3].trim().toUpperCase()
          postalCode = addressMatch[4].trim()
        } else {
          // Fallback: use whole address as street
          street1 = fullAddress
        }
      } else {
        // Use lead fields
        street1 = lead.address || ''
        city = lead.city || ''
        state = lead.state || ''
        postalCode = lead.postal_code || ''
      }

      // Combined street for non-split address CSV
      const combinedStreet = [street1, street2].filter(Boolean).join(' ').trim()

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
        // Address fields - support various naming conventions
        street: combinedStreet || street1,
        address1: street1,
        'address 1': street1,
        address2: street2,
        'address 2': street2,
        street1: street1,
        'street 1': street1,
        street2: street2,
        'street 2': street2,
        city: city,
        state: state,
        postal_code: postalCode,
        postalcode: postalCode,
        zip: postalCode,
        zipcode: postalCode,
        'zip code': postalCode,
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

  const handleEnrichSelected = async () => {
    if (selectedLeadIds.length === 0) return

    const isBulkEnrichment = selectedLeadIds.length >= AUTO_EXPORT_THRESHOLD
    setIsEnriching(true)
    setEnrichmentProgress({ current: 0, total: selectedLeadIds.length })

    // Get leads to enrich
    const leadsToEnrich = localLeads.filter((l) => selectedLeadIds.includes(l.id))

    for (let i = 0; i < leadsToEnrich.length; i++) {
      const lead = leadsToEnrich[i]
      setEnrichmentProgress({ current: i + 1, total: leadsToEnrich.length })

      try {
        // Call the scrape API to enrich the lead
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
          // Update the lead with enriched data
          updateLocalLead(lead.id, {
            enrichment_status: 'enriched',
            enrichment_data: data,
            email: data.emails?.[0]?.email || lead.email,
            phone: data.phones?.[0] || lead.phone,
            website: data.url || lead.website,
          })
        } else {
          updateLocalLead(lead.id, { enrichment_status: 'failed' })
        }
      } catch (err) {
        console.error('Enrichment error:', err)
        updateLocalLead(lead.id, { enrichment_status: 'failed' })
      }

      // Add a small delay between requests to avoid rate limiting
      if (i < leadsToEnrich.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
      }
    }

    setIsEnriching(false)
    clearSelection()

    // Auto-export if this was a bulk enrichment
    if (isBulkEnrichment) {
      // Small delay to ensure state is updated before export
      setTimeout(() => {
        const baseName = importedFileName || 'leads'
        exportLeads(localLeads, `${baseName}-enriched.csv`)
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
