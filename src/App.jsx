import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LeadInputForm } from './components/LeadInputForm';
import { LeadTable } from './components/LeadTable';
import { CsvUploader } from './components/CsvUploader';
import { SettingsModal } from './components/SettingsModal';
import { LeadFinderModal } from './components/LeadFinderModal';
import { enrichmentService } from './leadEnrichment';

function App() {
  const [leads, setLeads] = useState(() => {
    // Initialize from local storage if available
    const saved = localStorage.getItem('leadgen_leads');
    return saved ? JSON.parse(saved) : [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  // Persist to local storage whenever leads change
  React.useEffect(() => {
    localStorage.setItem('leadgen_leads', JSON.stringify(leads));
  }, [leads]);

  const addLead = (lead) => {
    setLeads(prev => [lead, ...prev]);
  };

  const handleCsvUpload = (importedLeads) => {
    setLeads(prev => [...importedLeads, ...prev]);
  };

  const [processingStatus, setProcessingStatus] = useState(null); // { current: 0, total: 0 } or null
  const [leadToEdit, setLeadToEdit] = useState(null);

  const handleEditClick = (lead) => {
    setLeadToEdit(lead);
    // Smooth scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveLead = (leadData) => {
    if (leadToEdit) {
      updateLead(leadData);
      setLeadToEdit(null);
    } else {
      addLead(leadData);
    }
  };

  const updateLead = (updatedLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
  };

  const deleteLead = (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
    }
  };

  const clearLeads = () => {
    if (window.confirm('Are you sure you want to CLEAR ALL leads? This will delete your current list and you will need to upload/find new leads.')) {
      setLeads([]);
    }
  };

  const enrichLead = async (leadToEnrich, isBatch = false) => {
    if (!isBatch) setIsProcessing(true);
    try {
      const enriched = await enrichmentService.enrich(leadToEnrich);
      setLeads(prev => prev.map(l => l.id === leadToEnrich.id ? enriched : l));
    } catch (err) {
      console.error(err);
      if (!isBatch) alert('Enrichment failed. See console for details.');
    } finally {
      if (!isBatch) setIsProcessing(false);
    }
  };

  const handleEnrichAll = async () => {
    if (leads.length === 0) return;

    // Filter for unenriched leads if you want, but user might want to re-run. 
    // For now, run all.
    const leadsToProcess = leads;

    setIsProcessing(true);
    setProcessingStatus({ current: 0, total: leadsToProcess.length });

    for (let i = 0; i < leadsToProcess.length; i++) {
      const lead = leadsToProcess[i];
      setProcessingStatus({ current: i + 1, total: leadsToProcess.length });

      await enrichLead(lead, true);

      // Random delay 1s-2s to be polite and avoid IP bans
      if (i < leadsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      }
    }

    setIsProcessing(false);
    setProcessingStatus(null);
  };

  const exportCsv = () => {
    if (leads.length === 0) return;

    // Merge original data with current application state (enriched fields)
    const exportData = leads.map(lead => {
      const { originalData, id, status, ...appFields } = lead;
      // We prioritize appFields (enriched) over originalData calls if they exist, 
      // or we can just merge.
      // Strategy: Start with original CSV data, overwrite with any updated App fields (like enriched info)
      return {
        ...originalData,
        ...appFields
      };
    });

    // Standard CRM Header Mapping
    const headerMap = {
      firstName: 'First Name',
      lastName: 'Last Name',
      company: 'Company',
      website: 'Website',
      facebookUrl: 'Facebook URL',
      instagramUrl: 'Instagram URL',
      twitterUrl: 'Twitter/X URL',
      youtubeUrl: 'YouTube URL',
      linkedinUrl: 'LinkedIn URL',
      tiktokUrl: 'TikTok URL',
      title: 'Title',
      phone: 'Direct Phone',
      generalPhone: 'Office Phone',
      email: 'Direct Email',
      generalEmail: 'Office Email',
      address: 'Address',
      fullAddress: 'Full Address',
      city: 'City',
      state: 'State',
      zip: 'Zip Code',
      leadSource: 'Lead Source',
      emailGenerated: 'Email Generated',
      emailValidated: 'Email Validated'
    };

    // To be safe, we gather all unique keys from all records
    const allInternalKeys = Array.from(new Set(exportData.flatMap(Object.keys)));

    // Sort keys based on priority (defined in headerMap), others at end
    const sortedKeys = allInternalKeys.sort((a, b) => {
      const indexA = Object.keys(headerMap).indexOf(a);
      const indexB = Object.keys(headerMap).indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    const csvHeaders = sortedKeys.map(k => headerMap[k] || k);

    // Data Cleaners
    const cleanWebsite = (url) => {
      if (!url) return '';
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    };

    const formatPhone = (phone) => {
      if (!phone) return '';
      const cleaned = ('' + phone).replace(/\D/g, '');
      const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
    };

    const csvContent = [
      csvHeaders.join(','),
      ...exportData.map(row =>
        sortedKeys.map(key => {
          let val = row[key] || '';

          // Apply formatting based on key name
          if (key === 'website' ||
            key === 'facebookUrl' ||
            key === 'instagramUrl' ||
            key === 'twitterUrl' ||
            key === 'youtubeUrl' ||
            key === 'linkedinUrl' ||
            key === 'tiktokUrl') val = cleanWebsite(val);
          if (key === 'phone' || key === 'generalPhone') val = formatPhone(val);

          return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'enriched_leads_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div style={{ width: '100%', margin: '0 auto' }}>

        {/* Top Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(true)}>
            Settings
          </button>
          <CsvUploader onUpload={handleCsvUpload} />
          <button className="btn btn-secondary" onClick={() => setIsFinderOpen(true)}>
            🔍 Find Leads
          </button>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={leads.length === 0}>
            Export CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={clearLeads}
            disabled={leads.length === 0}
            style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.2)' }}
          >
            Clear All
          </button>
        </div>

        <LeadInputForm
          onSaveLead={handleSaveLead}
          leadToEdit={leadToEdit}
          onCancelEdit={() => setLeadToEdit(null)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2>Leads ({leads.length})</h2>
            {leads.length > 0 && (
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                onClick={handleEnrichAll}
                disabled={isProcessing}
              >
                {isProcessing && processingStatus ? `Processing (${processingStatus.current}/${processingStatus.total})` : isProcessing ? 'Processing...' : 'Enrich All'}
              </button>
            )}
          </div>
          {isProcessing && processingStatus && (
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
              Enriching lead {processingStatus.current} of {processingStatus.total}...
            </span>
          )}
        </div>

        <LeadTable leads={leads} onEnrich={enrichLead} onEdit={handleEditClick} onDelete={deleteLead} />
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LeadFinderModal
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
        onImportLeads={handleCsvUpload}
      />
    </Layout>
  )
}

export default App
