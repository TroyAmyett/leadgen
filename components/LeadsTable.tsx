'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building,
  MapPin,
  Facebook,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Globe,
} from 'lucide-react'
import { useLeadsStore, LocalLead } from '@/stores/leadsStore'
import { LeadFormModal } from '@/components/LeadFormModal'

// Use LocalLead type which is simpler and works for both local and DB leads
interface LeadsTableProps {
  leads: LocalLead[]
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
  const { toggleLeadSelection } = useLeadsStore()
  const [editingLead, setEditingLead] = useState<LocalLead | null>(null)

  const handleDelete = (lead: LocalLead) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      toggleLeadSelection(lead.id)
    }
  }

  const handleEnrich = (lead: LocalLead) => {
    // Select the lead and parent will handle enrichment
    toggleLeadSelection(lead.id)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      new: 'badge-new',
      contacted: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      qualified: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      converted: 'badge-enriched',
      disqualified: 'badge-error',
      archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    }
    return badges[status] || 'badge-new'
  }

  const getEnrichmentBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-pending',
      enriching: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      enriched: 'badge-enriched',
      failed: 'badge-error',
      skipped: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    }
    return badges[status] || 'badge-pending'
  }

  const getSocialIcon = (url: string) => {
    const lower = url.toLowerCase()
    if (lower.includes('facebook.com')) return Facebook
    if (lower.includes('linkedin.com')) return Linkedin
    if (lower.includes('instagram.com')) return Instagram
    if (lower.includes('twitter.com') || lower.includes('x.com')) return Twitter
    if (lower.includes('youtube.com')) return Youtube
    if (lower.includes('tiktok.com')) return Globe // No TikTok icon in lucide, use Globe
    return Globe
  }

  const getAddressFromLead = (lead: LocalLead) => {
    const enrichData = lead.enrichment_data as Record<string, unknown> | undefined
    const addresses = (enrichData?.addresses as string[]) || []
    if (addresses.length > 0) return addresses[0]

    // Fallback to lead fields
    const parts = [lead.address, lead.city, lead.state, lead.postal_code].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  const getSocialsFromLead = (lead: LocalLead) => {
    const enrichData = lead.enrichment_data as Record<string, unknown> | undefined
    const socials: string[] = []

    // Add Facebook if found
    if (enrichData?.facebookUrl) {
      socials.push(enrichData.facebookUrl as string)
    }

    // Add other socials from enrichment
    if (enrichData?.socials && Array.isArray(enrichData.socials)) {
      socials.push(...(enrichData.socials as string[]))
    }

    // Add LinkedIn from lead data
    if (lead.linkedin_url) {
      socials.push(lead.linkedin_url)
    }

    // Dedupe
    return [...new Set(socials)]
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
              <th className="w-24">Actions</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Company</th>
              <th>Address</th>
              <th>Socials</th>
              <th>Status</th>
              <th>Enrichment</th>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEnrich(lead)}
                      className="p-1.5 rounded hover:bg-fl-primary/20 text-fl-text-muted hover:text-fl-primary transition-colors group relative"
                      title="Enrich"
                    >
                      <Sparkles size={14} />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-fl-bg-elevated border border-fl-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Enrich
                      </span>
                    </button>
                    <button
                      onClick={() => setEditingLead(lead)}
                      className="p-1.5 rounded hover:bg-fl-primary/20 text-fl-text-muted hover:text-fl-primary transition-colors group relative"
                      title="Edit"
                    >
                      <Edit size={14} />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-fl-bg-elevated border border-fl-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(lead)}
                      className="p-1.5 rounded hover:bg-fl-error/20 text-fl-text-muted hover:text-fl-error transition-colors group relative"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-fl-bg-elevated border border-fl-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Delete
                      </span>
                    </button>
                  </div>
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
                  {(() => {
                    const address = getAddressFromLead(lead)
                    return address ? (
                      <div className="flex items-start gap-1 text-sm text-fl-text-secondary max-w-[200px]">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0 text-fl-text-muted" />
                        <span className="truncate" title={address}>{address}</span>
                      </div>
                    ) : (
                      <span className="text-fl-text-muted text-sm">-</span>
                    )
                  })()}
                </td>
                <td>
                  {(() => {
                    const socials = getSocialsFromLead(lead)
                    return socials.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {socials.slice(0, 4).map((url, i) => {
                          const Icon = getSocialIcon(url)
                          return (
                            <a
                              key={i}
                              href={url.startsWith('http') ? url : `https://${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-fl-primary/20 text-fl-text-muted hover:text-fl-primary transition-colors"
                              title={url}
                            >
                              <Icon size={14} />
                            </a>
                          )
                        })}
                        {socials.length > 4 && (
                          <span className="text-xs text-fl-text-muted">+{socials.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-fl-text-muted text-sm">-</span>
                    )
                  })()}
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
