import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import type { Lead, LeadInsert, LeadUpdate } from '@/lib/types/database'

interface LeadsState {
  leads: Lead[]
  loading: boolean
  error: string | null
  selectedLeadIds: string[]
  searchQuery: string
  statusFilter: string | null
  enrichmentFilter: string | null

  // Actions
  fetchLeads: (accountId: string) => Promise<void>
  createLead: (lead: LeadInsert) => Promise<Lead | null>
  updateLead: (id: string, updates: LeadUpdate) => Promise<boolean>
  deleteLead: (id: string, userId: string) => Promise<boolean>
  bulkDeleteLeads: (ids: string[], userId: string) => Promise<boolean>
  toggleLeadSelection: (id: string) => void
  selectAllLeads: () => void
  clearSelection: () => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: string | null) => void
  setEnrichmentFilter: (status: string | null) => void
  clearError: () => void
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  loading: false,
  error: null,
  selectedLeadIds: [],
  searchQuery: '',
  statusFilter: null,
  enrichmentFilter: null,

  fetchLeads: async (accountId: string) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' })
      return
    }

    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('account_id', accountId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ leads: data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch leads'
      set({ error: message, loading: false })
    }
  },

  createLead: async (lead: LeadInsert) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' })
      return null
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        leads: [data, ...state.leads],
      }))

      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lead'
      set({ error: message })
      return null
    }
  },

  updateLead: async (id: string, updates: LeadUpdate) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' })
      return false
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        leads: state.leads.map((lead) => (lead.id === id ? data : lead)),
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update lead'
      set({ error: message })
      return false
    }
  },

  deleteLead: async (id: string, userId: string) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' })
      return false
    }

    try {
      // Soft delete
      const { error } = await supabase
        .from('leads')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          deleted_by_type: 'user',
        })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
        selectedLeadIds: state.selectedLeadIds.filter((leadId) => leadId !== id),
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete lead'
      set({ error: message })
      return false
    }
  },

  bulkDeleteLeads: async (ids: string[], userId: string) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' })
      return false
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          deleted_by_type: 'user',
        })
        .in('id', ids)

      if (error) throw error

      set((state) => ({
        leads: state.leads.filter((lead) => !ids.includes(lead.id)),
        selectedLeadIds: [],
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete leads'
      set({ error: message })
      return false
    }
  },

  toggleLeadSelection: (id: string) => {
    set((state) => ({
      selectedLeadIds: state.selectedLeadIds.includes(id)
        ? state.selectedLeadIds.filter((leadId) => leadId !== id)
        : [...state.selectedLeadIds, id],
    }))
  },

  selectAllLeads: () => {
    const { leads, searchQuery, statusFilter, enrichmentFilter } = get()
    const filteredLeads = getFilteredLeads(leads, searchQuery, statusFilter, enrichmentFilter)
    set({ selectedLeadIds: filteredLeads.map((lead) => lead.id) })
  },

  clearSelection: () => {
    set({ selectedLeadIds: [] })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setStatusFilter: (status: string | null) => {
    set({ statusFilter: status })
  },

  setEnrichmentFilter: (status: string | null) => {
    set({ enrichmentFilter: status })
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Helper function to filter leads
export function getFilteredLeads(
  leads: Lead[],
  searchQuery: string,
  statusFilter: string | null,
  enrichmentFilter: string | null
): Lead[] {
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
