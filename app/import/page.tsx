'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, FileText, ArrowRight, Check, AlertCircle, X } from 'lucide-react'
import Papa from 'papaparse'
import { useLeadsStore, LocalLead } from '@/stores/leadsStore'

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete'

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
}

const LEAD_FIELDS = [
  { value: '', label: 'Skip this column' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'title', label: 'Title' },
  { value: 'website', label: 'Website' },
  { value: 'linkedin_url', label: 'LinkedIn URL' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'postal_code', label: 'Postal Code' },
]

// Auto-mapping suggestions
const AUTO_MAPPING: Record<string, string> = {
  'first name': 'first_name',
  'firstname': 'first_name',
  'first': 'first_name',
  'last name': 'last_name',
  'lastname': 'last_name',
  'last': 'last_name',
  'email': 'email',
  'e-mail': 'email',
  'email address': 'email',
  'phone': 'phone',
  'phone number': 'phone',
  'telephone': 'phone',
  'mobile': 'phone',
  'company': 'company',
  'company name': 'company',
  'organization': 'company',
  'title': 'title',
  'job title': 'title',
  'position': 'title',
  'website': 'website',
  'url': 'website',
  'web': 'website',
  'linkedin': 'linkedin_url',
  'linkedin url': 'linkedin_url',
  'address': 'address',
  'street': 'address',
  'street address': 'address',
  'city': 'city',
  'state': 'state',
  'province': 'state',
  'postal code': 'postal_code',
  'postalcode': 'postal_code',
  'zip': 'postal_code',
  'zip code': 'postal_code',
  'zipcode': 'postal_code',
}

export default function ImportPage() {
  const router = useRouter()
  const importLeads = useLeadsStore((state) => state.importLeads)

  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      processFile(droppedFile)
    } else {
      setError('Please upload a CSV file')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as Record<string, string>[]

        setParsedData({ headers, rows })

        // Auto-map columns
        const autoMapping: Record<string, string> = {}
        headers.forEach((header) => {
          const normalized = header.toLowerCase().trim()
          if (AUTO_MAPPING[normalized]) {
            autoMapping[header] = AUTO_MAPPING[normalized]
          }
        })
        setColumnMapping(autoMapping)

        setStep('mapping')
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`)
      },
    })
  }

  const handleMappingChange = (csvColumn: string, leadField: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [csvColumn]: leadField,
    }))
  }

  const handleImport = async () => {
    if (!parsedData) return

    setIsImporting(true)
    setError(null)

    try {
      // Map rows to leads directly in memory (no API call needed)
      const mappedLeads: LocalLead[] = []
      const errors: string[] = []

      for (let i = 0; i < parsedData.rows.length; i++) {
        const row = parsedData.rows[i]
        try {
          const lead: LocalLead = {
            id: crypto.randomUUID(),
            source: 'csv_import',
            status: 'new',
            enrichment_status: 'pending',
            original_data: row,
          }

          // Map fields based on column mapping
          for (const [csvColumn, leadField] of Object.entries(columnMapping)) {
            const value = row[csvColumn]
            if (value !== undefined && value !== null && value !== '') {
              switch (leadField) {
                case 'first_name':
                  lead.first_name = String(value)
                  break
                case 'last_name':
                  lead.last_name = String(value)
                  break
                case 'email':
                  lead.email = String(value).toLowerCase()
                  break
                case 'phone':
                  lead.phone = String(value)
                  break
                case 'company':
                  lead.company = String(value)
                  break
                case 'title':
                  lead.title = String(value)
                  break
                case 'website':
                  lead.website = String(value)
                  break
                case 'linkedin_url':
                  lead.linkedin_url = String(value)
                  break
                case 'address':
                  lead.address = String(value)
                  break
                case 'city':
                  lead.city = String(value)
                  break
                case 'state':
                  lead.state = String(value)
                  break
                case 'postal_code':
                  lead.postal_code = String(value)
                  break
              }
            }
          }

          mappedLeads.push(lead)
        } catch (err) {
          errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }

      // Store leads in the zustand store with the original filename
      const originalFileName = file?.name?.replace(/\.csv$/i, '') || 'leads'
      importLeads(mappedLeads, originalFileName)

      setImportResult({
        imported: mappedLeads.length,
        failed: errors.length,
        errors: errors.slice(0, 10),
      })
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-fl-text-primary">Import Leads</h1>
        <p className="text-fl-text-secondary mt-1">
          Upload a CSV file to import leads for enrichment
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-fl-primary text-white'
                  : ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                  ? 'bg-fl-success text-white'
                  : 'bg-fl-bg-elevated text-fl-text-muted'
              }`}
            >
              {['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i ? (
                <Check size={16} />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                    ? 'bg-fl-success'
                    : 'bg-fl-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 rounded-lg bg-fl-error/20 border border-fl-error/30"
        >
          <AlertCircle className="w-5 h-5 text-fl-error flex-shrink-0" />
          <p className="text-fl-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-fl-error">
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Step Content */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`glass-card p-12 text-center border-2 border-dashed transition-colors ${
            isDragging ? 'border-fl-primary bg-fl-primary/5' : 'border-fl-border'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-fl-text-muted mb-4" />
          <p className="text-fl-text-primary font-medium mb-2">
            Drag and drop your CSV file here
          </p>
          <p className="text-fl-text-muted text-sm mb-4">or</p>
          <label className="btn-primary cursor-pointer">
            Browse Files
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {step === 'mapping' && parsedData && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-fl-text-primary">
                Map Columns
              </h2>
              <p className="text-sm text-fl-text-secondary">
                Match CSV columns to lead fields
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-fl-text-muted">
              <FileText size={16} />
              {file?.name} ({parsedData.rows.length} rows)
            </div>
          </div>

          <div className="space-y-3">
            {parsedData.headers.map((header) => (
              <div
                key={header}
                className="flex items-center gap-4 p-3 rounded-lg bg-fl-bg-surface"
              >
                <span className="w-1/3 text-fl-text-primary font-medium truncate">
                  {header}
                </span>
                <ArrowRight size={16} className="text-fl-text-muted flex-shrink-0" />
                <select
                  value={columnMapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="input flex-1"
                >
                  {LEAD_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => {
                setStep('upload')
                setFile(null)
                setParsedData(null)
                setColumnMapping({})
              }}
              className="btn-secondary"
            >
              Back
            </button>
            <button onClick={() => setStep('preview')} className="btn-primary">
              Preview Import
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && parsedData && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-fl-text-primary">
              Preview Import
            </h2>
            <p className="text-sm text-fl-text-secondary">
              Review the first 5 rows before importing
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {Object.entries(columnMapping)
                    .filter(([, field]) => field)
                    .map(([, field]) => (
                      <th key={field}>
                        {LEAD_FIELDS.find((f) => f.value === field)?.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.entries(columnMapping)
                      .filter(([, field]) => field)
                      .map(([csvColumn, field]) => (
                        <td key={field}>{row[csvColumn] || '-'}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-fl-text-muted text-center">
            Showing first 5 of {parsedData.rows.length} rows
          </p>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep('mapping')} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="btn-primary"
            >
              {isImporting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </span>
              ) : (
                `Import ${parsedData.rows.length} Leads`
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && importResult && (
        <div className="glass-card p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fl-success/20">
            <Check className="w-8 h-8 text-fl-success" />
          </div>

          <div>
            <h2 className="text-xl font-medium text-fl-text-primary">
              Import Complete
            </h2>
            <p className="text-fl-text-secondary mt-2">
              Successfully imported {importResult.imported} lead
              {importResult.imported !== 1 ? 's' : ''}
              {importResult.failed > 0 &&
                ` (${importResult.failed} failed)`}
            </p>
          </div>

          {importResult.errors.length > 0 && (
            <div className="text-left p-4 rounded-lg bg-fl-warning/20 border border-fl-warning/30">
              <p className="text-sm font-medium text-fl-warning mb-2">
                Some rows had errors:
              </p>
              <ul className="text-sm text-fl-warning space-y-1">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => router.push('/leads')}
            className="btn-primary"
          >
            View Leads
          </button>
        </div>
      )}
    </div>
  )
}
