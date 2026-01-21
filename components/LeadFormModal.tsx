'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, User, Building, Mail, Phone, Globe, Linkedin } from 'lucide-react'
import { useLeadsStore, LocalLead } from '@/stores/leadsStore'

interface LeadFormModalProps {
  lead?: LocalLead
  onClose: () => void
}

export function LeadFormModal({ lead, onClose }: LeadFormModalProps) {
  const { updateLocalLead, importLeads } = useLeadsStore()

  const [formData, setFormData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    title: lead?.title || '',
    website: lead?.website || '',
    linkedin_url: lead?.linkedin_url || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError(null)

    try {
      if (lead) {
        // Update existing local lead
        updateLocalLead(lead.id, {
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          title: formData.title || null,
          website: formData.website || null,
          linkedin_url: formData.linkedin_url || null,
        })
      } else {
        // Create new local lead
        const newLead: LocalLead = {
          id: crypto.randomUUID(),
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          title: formData.title || null,
          website: formData.website || null,
          linkedin_url: formData.linkedin_url || null,
          source: 'manual',
          status: 'new',
          enrichment_status: 'pending',
        }
        importLeads([newLead])
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg glass-card p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-fl-text-primary">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-fl-bg-surface text-fl-text-muted hover:text-fl-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-fl-error/20 border border-fl-error/30 text-fl-error text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="label">
                <User size={14} className="inline mr-1" />
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="input"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="label">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="input"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="label">
              <Mail size={14} className="inline mr-1" />
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="label">
              <Phone size={14} className="inline mr-1" />
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="label">
              <Building size={14} className="inline mr-1" />
              Company
            </label>
            <input
              id="company"
              name="company"
              type="text"
              value={formData.company}
              onChange={handleChange}
              className="input"
              placeholder="Acme Inc."
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="CEO"
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="label">
              <Globe size={14} className="inline mr-1" />
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              className="input"
              placeholder="https://example.com"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label htmlFor="linkedin_url" className="label">
              <Linkedin size={14} className="inline mr-1" />
              LinkedIn URL
            </label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleChange}
              className="input"
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {lead ? 'Saving...' : 'Creating...'}
                </span>
              ) : lead ? (
                'Save Changes'
              ) : (
                'Create Lead'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
