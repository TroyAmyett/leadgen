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

export default function LeadsPage() {
  const router = useRouter()
  const {
    localLeads,
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

  const handleEnrichSelected = async () => {
    if (selectedLeadIds.length === 0) return

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
    if (filteredLeads.length === 0) return

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Title',
      'Website',
      'Status',
      'Enrichment Status',
    ]

    const rows = filteredLeads.map((lead) => [
      lead.first_name || '',
      lead.last_name || '',
      lead.email || '',
      lead.phone || '',
      lead.company || '',
      lead.title || '',
      lead.website || '',
      lead.status,
      lead.enrichment_status,
    ])

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
    link.setAttribute('download', 'leads_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
