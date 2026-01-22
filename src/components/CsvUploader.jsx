import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { CsvMapper } from './CsvMapper';

export function CsvUploader({ onUpload }) {
    const fileInputRef = useRef(null);

    const [mapperConfig, setMapperConfig] = useState(null); // { headers: [], rawData: [] }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta && results.meta.fields) {
                    // Open Mapper instead of importing immediately
                    setMapperConfig({
                        headers: results.meta.fields,
                        rawData: results.data
                    });
                }
                // Reset input so same file can be selected again if cancelled
                e.target.value = null;
            },
            error: (err) => {
                console.error('CSV Parse Error:', err);
                alert('Failed to parse CSV');
            }
        });
    };

    const handleMappingConfirm = (mapping) => {
        if (!mapperConfig) return;

        const mappedLeads = mapperConfig.rawData.map(row => {
            const newLead = {
                id: crypto.randomUUID(),
                status: 'Imported',
                notes: '',
                campaign: '',
                leadSource: 'CSV Import',
                originalData: row // Store the full original row
            };

            // Apply mapping
            Object.entries(mapping).forEach(([fieldKey, csvHeader]) => {
                if (csvHeader && row[csvHeader]) {
                    newLead[fieldKey] = row[csvHeader];
                }
            });

            return newLead;
        });

        onUpload(mappedLeads);
        setMapperConfig(null);
    };

    return (
        <div style={{ display: 'inline-block' }}>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
            />
            <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
            >
                Import CSV
            </button>

            {mapperConfig && (
                <CsvMapper
                    csvHeaders={mapperConfig.headers}
                    onConfirm={handleMappingConfirm}
                    onCancel={() => setMapperConfig(null)}
                />
            )}
        </div>
    );
}
