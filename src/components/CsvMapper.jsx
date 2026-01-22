import React, { useState, useEffect } from 'react';

const REQUIRED_FIELDS = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'generalEmail', label: 'Office Email' },
    { key: 'company', label: 'Company' },
    { key: 'website', label: 'Website' },
    { key: 'title', label: 'Title' },
    { key: 'phone', label: 'Phone' },
    { key: 'generalPhone', label: 'Office Phone' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'Zip Code' },
    { key: 'address', label: 'Address' },
    { key: 'fullAddress', label: 'Full Address' },
    { key: 'facebookUrl', label: 'Facebook URL' },
    { key: 'instagramUrl', label: 'Instagram URL' },
    { key: 'twitterUrl', label: 'Twitter/X URL' },
    { key: 'youtubeUrl', label: 'YouTube URL' },
    { key: 'linkedinUrl', label: 'LinkedIn URL' },
    { key: 'tiktokUrl', label: 'TikTok URL' }
];

export function CsvMapper({ csvHeaders, onConfirm, onCancel }) {
    const [mapping, setMapping] = useState({});

    useEffect(() => {
        // Auto-guess mapping
        const initialMapping = {};
        REQUIRED_FIELDS.forEach(field => {
            // Find a header that looks like the field label or key
            const match = csvHeaders.find(h =>
                h.toLowerCase().includes(field.label.toLowerCase()) ||
                h.toLowerCase().replace(/_/g, '').includes(field.key.toLowerCase())
            );
            if (match) {
                initialMapping[field.key] = match;
            }
        });
        setMapping(initialMapping);
    }, [csvHeaders]);

    const handleChange = (fieldKey, header) => {
        setMapping(prev => ({
            ...prev,
            [fieldKey]: header
        }));
    };

    const handleSave = () => {
        onConfirm(mapping);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div className="glass-panel" style={{ width: '500px', padding: '2rem', maxHeight: '80vh', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1rem' }}>Map CSV Columns</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Match your CSV headers to the system fields.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {REQUIRED_FIELDS.map(field => (
                        <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ margin: 0 }}>{field.label}</label>
                            <select
                                value={mapping[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                            >
                                <option value="">-- Ignore --</option>
                                {csvHeaders.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Import Leads</button>
                </div>
            </div>
        </div>
    );
}
