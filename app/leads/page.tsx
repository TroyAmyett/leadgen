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
import { useAuthStore } from '@/stores/authStore'
import { useLeadsStore, getFilteredLeads } from '@/stores/leadsStore'
import { LeadsTable } from '@/components/LeadsTable'
import { LeadFormModal } from '@/components/LeadFormModal'
import { EnrichmentProgress } from '@/components/EnrichmentProgress'

const ITEMS_PER_PAGE = 10

export default function LeadsPage() {
  const router = useRouter()
  const { user, accountId, loading: authLoading } = useAuthStore()
  const {
    leads,
    loading,
    error,
    selectedLeadIds,
    searchQuery,
    statusFilter,
    enrichmentFilter,
    fetchLeads,
    setSearchQuery,
    setStatusFilter,
    setEnrichmentFilter,
    selectAllLeads,
    clearSelection,
    bulkDeleteLeads,
  } = useLeadsStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0 })

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Fetch leads when account is available
  useEffect(() => {
    if (accountId) {
      fetchLeads(accountId)
    }
  }, [accountId, fetchLeads])

  // Get filtered leads
  const filteredLeads = getFilteredLeads(leads, searchQuery, statusFilter, enrichmentFilter)

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

    // TODO: Implement enrichment logic
    for (let i = 0; i < selectedLeadIds.length; i++) {
      setEnrichmentProgress({ current: i + 1, total: selectedLeadIds.length })
      // Simulate enrichment delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setIsEnriching(false)
    clearSelection()
  }

  const handleDeleteSelected = async () => {
    if (selectedLeadIds.length === 0 || !user) return

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedLeadIds.length} lead(s)?`
      )
    ) {
      await bulkDeleteLeads(selectedLeadIds, user.id)
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fl-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fl-text-primary">Leads</h1>
          <p className="text-fl-text-secondary mt-1">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            {leads.length !== filteredLeads.length && ` (filtered from ${leads.length})`}
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

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-fl-error/20 border border-fl-error/30 text-fl-error"
        >
          {error}
        </motion.div>
      )}

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
