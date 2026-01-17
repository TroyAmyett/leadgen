'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MoreVertical,
  Sparkles,
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building,
} from 'lucide-react'
import { useLeadsStore } from '@/stores/leadsStore'
import { useAuthStore } from '@/stores/authStore'
import { LeadFormModal } from '@/components/LeadFormModal'
import type { Lead } from '@/lib/types/database'

interface LeadsTableProps {
  leads: Lead[]
  selectedIds: string[]
  onSelectAll: () => void
  onClearSelection: () => void
  allSelected: boolean
}

export function LeadsTable({
  leads,
  selectedIds,
  onSelectAll,
  onClearSelection,
  allSelected,
}: LeadsTableProps) {
  const { user } = useAuthStore()
  const { toggleLeadSelection, deleteLead, updateLead } = useLeadsStore()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  const handleDelete = async (lead: Lead) => {
    if (!user) return
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await deleteLead(lead.id, user.id)
    }
    setMenuOpen(null)
  }

  const handleEnrich = async (lead: Lead) => {
    // TODO: Implement single lead enrichment
    console.log('Enriching lead:', lead.id)
    setMenuOpen(null)
  }

  const getStatusBadge = (status: Lead['status']) => {
    const badges: Record<Lead['status'], string> = {
      new: 'badge-new',
      contacted: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      qualified: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      converted: 'badge-enriched',
      disqualified: 'badge-error',
      archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    }
    return badges[status] || 'badge-new'
  }

  const getEnrichmentBadge = (status: Lead['enrichment_status']) => {
    const badges: Record<Lead['enrichment_status'], string> = {
      pending: 'badge-pending',
      enriching: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      enriched: 'badge-enriched',
      failed: 'badge-error',
      skipped: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    }
    return badges[status] || 'badge-pending'
  }

  if (leads.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-fl-text-muted">No leads found</p>
        <p className="text-fl-text-muted text-sm mt-1">
          Add leads manually or import from a CSV file
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="table-container overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => (allSelected ? onClearSelection() : onSelectAll())}
                  className="w-4 h-4 rounded border-fl-border bg-fl-bg-surface text-fl-primary focus:ring-fl-primary"
                />
              </th>
              <th>Name</th>
              <th>Contact</th>
              <th>Company</th>
              <th>Status</th>
              <th>Enrichment</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={selectedIds.includes(lead.id) ? 'bg-fl-primary/5' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleLeadSelection(lead.id)}
                    className="w-4 h-4 rounded border-fl-border bg-fl-bg-surface text-fl-primary focus:ring-fl-primary"
                  />
                </td>
                <td>
                  <div>
                    <p className="font-medium text-fl-text-primary">
                      {lead.first_name || lead.last_name
                        ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                        : 'Unknown'}
                    </p>
                    {lead.title && (
                      <p className="text-xs text-fl-text-muted">{lead.title}</p>
                    )}
                  </div>
                </td>
                <td>
                  <div className="space-y-1">
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1 text-fl-text-secondary hover:text-fl-primary text-sm"
                      >
                        <Mail size={12} />
                        {lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1 text-fl-text-secondary hover:text-fl-primary text-sm"
                      >
                        <Phone size={12} />
                        {lead.phone}
                      </a>
                    )}
                    {!lead.email && !lead.phone && (
                      <span className="text-fl-text-muted text-sm">No contact info</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-fl-text-muted" />
                    <div>
                      <p className="text-fl-text-primary">
                        {lead.company || 'Unknown'}
                      </p>
                      {lead.website && (
                        <a
                          href={
                            lead.website.startsWith('http')
                              ? lead.website
                              : `https://${lead.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-fl-text-muted hover:text-fl-primary"
                        >
                          <ExternalLink size={10} />
                          {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getEnrichmentBadge(lead.enrichment_status)}`}>
                    {lead.enrichment_status}
                  </span>
                </td>
                <td>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === lead.id ? null : lead.id)}
                      className="p-1 rounded hover:bg-fl-bg-surface"
                    >
                      <MoreVertical size={16} className="text-fl-text-muted" />
                    </button>

                    {menuOpen === lead.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 top-full mt-1 w-40 py-1 rounded-lg bg-fl-bg-elevated border border-fl-border shadow-xl z-20"
                        >
                          <button
                            onClick={() => handleEnrich(lead)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fl-text-primary hover:bg-fl-bg-surface"
                          >
                            <Sparkles size={14} />
                            Enrich
                          </button>
                          <button
                            onClick={() => {
                              setEditingLead(lead)
                              setMenuOpen(null)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fl-text-primary hover:bg-fl-bg-surface"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lead)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fl-error hover:bg-fl-error/10"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingLead && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
        />
      )}
    </>
  )
}
