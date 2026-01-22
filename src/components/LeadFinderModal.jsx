import React, { useState } from 'react';

export function LeadFinderModal({ isOpen, onClose, onImportLeads }) {
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isExtracting, setIsExtracting] = useState(null); // URL being extracted
    const [viewStack, setViewStack] = useState([]); // [{ title, results }]
    const [selectedIndices, setSelectedIndices] = useState(new Set());

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword && !description) return;

        setIsSearching(true);
        setResults([]);
        setSelectedIndices(new Set());

        try {
            let query = '';
            if (description) {
                query = location ? `${description} in ${location}` : description;
            } else {
                query = location ? `${keyword} in ${location}` : keyword;
            }

            console.log(`[LeadFinder] Searching with query: ${query}`);
            const res = await fetch('http://localhost:4001/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await res.json();
            if (data.success && data.results) {
                // Filter out obviously bad results (like internal search links or pure directories if possible)
                // For now, show all legitimate looking ones
                setResults(data.results);
                // Auto-select all? No, let user choose.
            }
        } catch (err) {
            console.error(err);
            alert('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleExtract = async (url, title) => {
        setIsExtracting(url);
        try {
            const res = await fetch('http://localhost:4001/extract-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (data.success && data.results) {
                // Save current view to stack
                setViewStack(prev => [...prev, { title: 'Search Results', results: results }]);
                setResults(data.results);
                setSelectedIndices(new Set());
            }
        } catch (err) {
            console.error(err);
            alert('Extraction failed');
        } finally {
            setIsExtracting(null);
        }
    };

    const handleBack = () => {
        if (viewStack.length === 0) return;
        const previous = viewStack[viewStack.length - 1];
        setViewStack(prev => prev.slice(0, -1));
        setResults(previous.results);
        setSelectedIndices(new Set());
    };

    const toggleSelection = (index) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const handleImport = () => {
        const selectedResults = results.filter((_, i) => selectedIndices.has(i));
        const newLeads = selectedResults.map(r => {
            // Clean Title to get Company Name
            // e.g. "Bob's Plumbing - Best Plumber in Austin" -> "Bob's Plumbing"
            let company = r.title;
            if (company.includes(' - ')) company = company.split(' - ')[0];
            if (company.includes(' | ')) company = company.split(' | ')[0];

            return {
                id: crypto.randomUUID(),
                firstName: 'Unknown',
                lastName: '',
                company: company.trim(),
                website: r.url,
                city: location.split(',')[0].trim(), // Approx logic
                state: location.includes(',') ? location.split(',')[1].trim() : '',
                leadSource: 'Lead Finder',
                status: 'New',
                notes: `Source: ${r.title}\nSnippet: ${r.snippet}`
            };
        });

        onImportLeads(newLeads);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginTop: 0 }}>Find New Leads</h2>
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Search for businesses to build your list (powered by Search Engine Rotation).</p>

                <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            placeholder="Keyword (e.g. Roofers)"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            placeholder="Location (e.g. Miami, FL)"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <textarea
                        placeholder="Describe what you are looking for (e.g. Churches with active youth programs and coffee shops)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={isSearching || (!keyword && !description)}>
                        {isSearching ? 'Searching...' : 'Find New Leads'}
                    </button>
                </form>

                {/* Breadcrumbs & Navigation */}
                {viewStack.length > 0 && (
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={handleBack} className="btn-text" style={{ color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, background: 'none', border: 'none', fontSize: '0.9rem' }}>
                            &larr; Back to Results
                        </button>
                        <span style={{ color: '#666' }}>/</span>
                        <span style={{ color: '#fff', fontSize: '0.9rem' }}>Extracted Leads</span>
                    </div>
                )}

                {/* Results List */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px', marginBottom: '1rem', backgroundColor: '#13131F' }}>
                    {results.length === 0 && !isSearching && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                            Enter a search above to see potential leads.
                        </div>
                    )}
                    {results.map((r, i) => (
                        <div key={i} style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'start',
                            backgroundColor: selectedIndices.has(i) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            transition: 'background-color 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIndices.has(i)}
                                    onChange={() => toggleSelection(i)}
                                    style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>{r.title}</div>
                                        {viewStack.length === 0 && !r.isManual && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleExtract(r.url, r.title); }}
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                                                disabled={isExtracting === r.url}
                                            >
                                                {isExtracting === r.url ? 'Extracting...' : 'Extract Leads'}
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }}>{r.url}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.4rem', lineHeight: '1.4' }}>{r.snippet}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>
                        {selectedIndices.size} leads selected
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleImport} className="btn btn-primary" disabled={selectedIndices.size === 0}>
                            Import Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalStyle = {
    backgroundColor: '#1E1E2E',
    padding: '1.5rem',
    borderRadius: '12px',
    width: '600px',
    maxWidth: '95%',
    border: '1px solid var(--border-subtle)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column'
};

const inputStyle = {
    flex: 1,
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: '#2A2A35', // Match dark theme input
    color: '#fff'
};
