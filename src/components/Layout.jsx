import React from 'react';

export function Layout({ children }) {
    return (
        <div className="layout-root">
            <header style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1rem 0', background: 'var(--bg-panel)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', borderRadius: 6 }}></div>
                        <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>LeadGen<span style={{ color: 'var(--accent-primary)' }}>.ai</span></span>
                    </div>
                    <nav>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>MicroApp Launchpad</span>
                    </nav>
                </div>
            </header>

            <main className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
                {children}
            </main>

            <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem 0', marginTop: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="container">
                    <p style={{ fontSize: '0.85rem' }}>&copy; {new Date().getFullYear()} Funnelists. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
