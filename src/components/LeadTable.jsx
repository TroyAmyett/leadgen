import React from 'react';

export function LeadTable({ leads, onEnrich, onEdit, onDelete }) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Pagination logic
    const totalPages = Math.ceil(leads.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLeads = leads.slice(startIndex, startIndex + itemsPerPage);

    // Reset page if out of bounds (e.g., after filtering/deleting)
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [leads.length, totalPages, currentPage]);

    if (leads.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No leads found. Add a lead manually or upload a CSV.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Table Container with Scroll */}
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '600px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131F' }}>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={thStyle}>Actions</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Company</th>
                            <th style={thStyle}>Website</th>
                            <th style={thStyle}>Socials</th>
                            <th style={thStyle}>Phone</th>
                            <th style={thStyle}>Office Phone</th>
                            <th style={thStyle}>Title</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Office Email</th>
                            <th style={thStyle}>Location</th>
                            <th style={thStyle}>Address</th>
                            <th style={thStyle}>Full Address</th>
                            <th style={thStyle}>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentLeads.map(lead => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => onEnrich(lead)}
                                            className="btn btn-secondary"
                                            title="Enrich Lead"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                        >
                                            Enrich
                                        </button>
                                        <button
                                            onClick={() => onEdit(lead)}
                                            className="btn btn-secondary"
                                            title="Edit Lead"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => onDelete(lead.id)}
                                            className="btn btn-secondary"
                                            title="Delete Lead"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', color: '#ff6b6b' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{lead.firstName} {lead.lastName}</div>
                                </td>
                                <td style={tdStyle}>{lead.company}</td>
                                <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {lead.website ? (
                                        <a
                                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                        >
                                            {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td style={{ ...tdStyle, minWidth: '120px' }}>
                                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                        {lead.facebookUrl && (
                                            <a
                                                href={lead.facebookUrl.trim().startsWith('http') ? lead.facebookUrl.trim() : `https://${lead.facebookUrl.trim()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#1877F2', textDecoration: 'none', fontSize: '1.1rem' }}
                                                title="Facebook"
                                            >
                                                FB
                                            </a>
                                        )}
                                        {lead.instagramUrl && (
                                            <a
                                                href={lead.instagramUrl.trim().startsWith('http') ? lead.instagramUrl.trim() : `https://${lead.instagramUrl.trim()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#E4405F', textDecoration: 'none', fontSize: '1.1rem' }}
                                                title="Instagram"
                                            >
                                                IG
                                            </a>
                                        )}
                                        {lead.twitterUrl && (
                                            <a
                                                href={lead.twitterUrl.trim().startsWith('http') ? lead.twitterUrl.trim() : `https://${lead.twitterUrl.trim()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#1DA1F2', textDecoration: 'none', fontSize: '1.1rem' }}
                                                title="Twitter / X"
                                            >
                                                X
                                            </a>
                                        )}
                                        {lead.youtubeUrl && (
                                            <a
                                                href={lead.youtubeUrl.trim().startsWith('http') ? lead.youtubeUrl.trim() : `https://${lead.youtubeUrl.trim()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#FF0000', textDecoration: 'none', fontSize: '1.1rem' }}
                                                title="YouTube"
                                            >
                                                YT
                                            </a>
                                        )}
                                        {lead.linkedinUrl && (
                                            <a
                                                href={lead.linkedinUrl.trim().startsWith('http') ? lead.linkedinUrl.trim() : `https://${lead.linkedinUrl.trim()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#0A66C2', textDecoration: 'none', fontSize: '1.1rem' }}
                                                title="LinkedIn"
                                            >
                                                LI
                                            </a>
                                        )}
                                        {lead.tiktokUrl && (
                                            <a
                                                href={lead.tiktokUrl.trim().startsWith('http') ? lead.tiktokUrl.trim() : `https://${lead.tiktokUrl.trim()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#000000', textDecoration: 'none', fontSize: '1.1rem', backgroundColor: '#fff', borderRadius: '4px', padding: '0 2px' }}
                                                title="TikTok"
                                            >
                                                TT
                                            </a>
                                        )}
                                        {!lead.facebookUrl && !lead.instagramUrl && !lead.twitterUrl && !lead.youtubeUrl && !lead.linkedinUrl && !lead.tiktokUrl && '-'}
                                    </div>
                                </td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatPhone(lead.phone)}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatPhone(lead.generalPhone)}</td>
                                <td style={tdStyle}>{lead.title || '-'}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {lead.email || '-'}
                                        {lead.emailGenerated && (
                                            <span title="Generated guess (not verified)" style={{ cursor: 'help', fontSize: '1rem' }}>
                                                ✨
                                            </span>
                                        )}
                                        {lead.emailValidated && (
                                            <span title="Email Validated" style={{ color: '#4ade80', fontSize: '1rem' }}>
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{lead.generalEmail || '-'}</td>
                                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {lead.city && lead.state ? `${lead.city}, ${lead.state}` : (lead.city || lead.state || '-')}
                                </td>
                                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.address}>
                                    {lead.address || '-'}
                                </td>
                                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.fullAddress}>
                                    {lead.fullAddress || '-'}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {lead.leadSource || 'N/A'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div >

            {
                totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.02)'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, leads.length)} of {leads.length}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                            >
                                Prev
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-primary)', padding: '0 0.5rem' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )
            }

        </div >
    );
}

const thStyle = {
    padding: '1rem',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    fontWeight: 600
};

const tdStyle = {
    padding: '1rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem'
};

function formatPhone(phone) {
    if (!phone) return '-';
    // Remove all non-numeric characters
    const cleaned = ('' + phone).replace(/\D/g, '');

    // Check if it's a valid US number length (10 or 11 starting with 1)
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);

    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    // Return original if no match (e.g. international or short code)
    return phone;
}
