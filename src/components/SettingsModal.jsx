import React, { useState, useEffect } from 'react';

export function SettingsModal({ isOpen, onClose }) {
    const [patterns, setPatterns] = useState([]);
    const [newValue, setNewValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch('http://localhost:4001/settings')
                .then(res => res.json())
                .then(data => setPatterns(data.exclusionPatterns || []))
                .catch(err => console.error('Failed to load settings', err));
        }
    }, [isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('http://localhost:4001/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exclusionPatterns: patterns })
            });
            if (response.ok) {
                onClose();
            }
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setIsSaving(false);
        }
    };

    const addPattern = () => {
        if (newValue && !patterns.includes(newValue)) {
            setPatterns([...patterns, newValue]);
            setNewValue('');
        }
    };

    const removePattern = (value) => {
        setPatterns(patterns.filter(p => p !== value));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '500px',
                padding: '2rem',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Scraper Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Exclusion Patterns
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Emails matching these patterns will be skipped during extraction.
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="e.g. example.com"
                            onKeyPress={(e) => e.key === 'Enter' && addPattern()}
                        />
                        <button className="btn btn-secondary" onClick={addPattern}>Add</button>
                    </div>

                    <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {patterns.map(p => (
                            <div key={p} style={{
                                background: 'var(--bg-app)',
                                border: '1px solid var(--border-subtle)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.85rem'
                            }}>
                                <span>{p}</span>
                                <button
                                    onClick={() => removePattern(p)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
