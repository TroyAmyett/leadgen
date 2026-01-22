import React, { useState } from 'react';

const initialFormState = {
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    website: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    tiktokUrl: '',
    email: '',
    generalEmail: '',
    phone: '',
    generalPhone: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    fullAddress: '',
    leadSource: '',
    campaign: '',
    notes: ''
};

export function LeadInputForm({ onSaveLead, leadToEdit, onCancelEdit }) {
    const [formData, setFormData] = useState(initialFormState);
    const [isExpanded, setIsExpanded] = useState(false);

    // Populate form when editing
    React.useEffect(() => {
        if (leadToEdit) {
            setFormData(leadToEdit);
            setIsExpanded(true);
        } else {
            setFormData(initialFormState);
            setIsExpanded(false);
        }
    }, [leadToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.lastName || !formData.company) return; // Basic validation

        // If editing, keep ID. If new, generate ID.
        const leadData = leadToEdit
            ? { ...formData }
            : { ...formData, id: crypto.randomUUID(), status: 'New' };

        onSaveLead(leadData);

        if (!leadToEdit) {
            setFormData(initialFormState);
            setIsExpanded(false);
        }
    };

    const handleCancel = () => {
        if (leadToEdit) {
            onCancelEdit();
        } else {
            setIsExpanded(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: leadToEdit ? '1px solid var(--accent-primary)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '1rem' : 0 }}>
                <h3 style={{ margin: 0 }}>{leadToEdit ? 'Edit Lead' : 'Add New Lead'}</h3>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => isExpanded ? handleCancel() : setIsExpanded(true)}
                >
                    {isExpanded ? 'Cancel' : 'Open Form'}
                </button>
            </div>

            {isExpanded && (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>

                    {/* Identity */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Identity</h4>
                    </div>
                    <div>
                        <label>First Name</label>
                        <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Jane" />
                    </div>
                    <div>
                        <label>Last Name *</label>
                        <input name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" />
                    </div>
                    <div>
                        <label>Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="CEO" />
                    </div>
                    <div>
                        <label>Company *</label>
                        <input name="company" value={formData.company} onChange={handleChange} required placeholder="Acme Corp" />
                    </div>
                    <div>
                        <label>Website</label>
                        <input name="website" type="text" value={formData.website} onChange={handleChange} placeholder="acme.com" title="Protocol (https://) is optional" />
                    </div>
                    <div>
                        <label>Facebook URL</label>
                        <input name="facebookUrl" type="text" value={formData.facebookUrl} onChange={handleChange} placeholder="facebook.com/page" title="Protocol (https://) is optional" />
                    </div>
                    <div>
                        <label>Instagram URL</label>
                        <input name="instagramUrl" type="text" value={formData.instagramUrl} onChange={handleChange} placeholder="instagram.com/user" />
                    </div>
                    <div>
                        <label>Twitter / X URL</label>
                        <input name="twitterUrl" type="text" value={formData.twitterUrl} onChange={handleChange} placeholder="x.com/user" />
                    </div>
                    <div>
                        <label>YouTube URL</label>
                        <input name="youtubeUrl" type="text" value={formData.youtubeUrl} onChange={handleChange} placeholder="youtube.com/c/user" />
                    </div>
                    <div>
                        <label>LinkedIn URL</label>
                        <input name="linkedinUrl" type="text" value={formData.linkedinUrl} onChange={handleChange} placeholder="linkedin.com/company/user" />
                    </div>
                    <div>
                        <label>TikTok URL</label>
                        <input name="tiktokUrl" type="text" value={formData.tiktokUrl} onChange={handleChange} placeholder="tiktok.com/@user" />
                    </div>

                    {/* Contact */}
                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Contact Info</h4>
                    </div>
                    <div>
                        <label>Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jane@example.com" />
                    </div>
                    <div>
                        <label>Office Email</label>
                        <input name="generalEmail" type="email" value={formData.generalEmail} onChange={handleChange} placeholder="office@example.com" />
                    </div>
                    <div>
                        <label>Phone</label>
                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div>
                        <label>Office Phone</label>
                        <input name="generalPhone" type="tel" value={formData.generalPhone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Address</label>
                        <input name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St" />
                    </div>
                    <div>
                        <label>City</label>
                        <input name="city" value={formData.city} onChange={handleChange} placeholder="San Francisco" />
                    </div>
                    <div>
                        <label>State</label>
                        <input name="state" value={formData.state} onChange={handleChange} placeholder="CA" />
                    </div>
                    <div>
                        <label>Zip Code</label>
                        <input name="zip" value={formData.zip} onChange={handleChange} placeholder="94105" />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Full Address</label>
                        <input name="fullAddress" value={formData.fullAddress} onChange={handleChange} placeholder="123 Main St, San Francisco, CA 94105" />
                    </div>

                    {/* Context */}
                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Campaign Context</h4>
                    </div>
                    <div>
                        <label>Lead Source</label>
                        <select name="leadSource" value={formData.leadSource} onChange={handleChange}>
                            <option value="">Select Source...</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Cold Outreach">Cold Outreach</option>
                        </select>
                    </div>
                    <div>
                        <label>Campaign</label>
                        <input name="campaign" value={formData.campaign} onChange={handleChange} placeholder="Q4 Outreach" />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Notes</label>
                        <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Additional details..." />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary">Save Lead</button>
                    </div>
                </form>
            )}
        </div>
    );
}
