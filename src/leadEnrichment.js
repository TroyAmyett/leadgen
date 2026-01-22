import axios from 'axios';

const API_URL = 'http://localhost:4001';

export const enrichmentService = {
    enrich: async (lead) => {
        try {
            console.log(`[Enrichment] Requesting enrichment for: ${lead.website || lead.company}`);
            const response = await axios.post(`${API_URL}/scrape`, {
                url: lead.website || '',
                firstName: lead.firstName || '',
                lastName: lead.lastName || '',
                company: lead.company || '',
                city: lead.city || '',
                state: lead.state || '',
                facebookUrl: lead.facebookUrl || ''
            });

            if (!response.data || !response.data.success) {
                throw new Error(response.data?.error || 'Enrichment failed');
            }

            const { emails, phones, socials, url, facebookUrl, officeEmail, officePhone, addresses } = response.data;
            const allSocials = socials || [];

            const scoredEmails = emails || [];
            const distinctEmails = scoredEmails.map(e => typeof e === 'string' ? e : e.email).filter(Boolean);
            const uniquePhones = [...new Set(phones || [])].filter(Boolean);
            const uniqueAddresses = [...new Set(addresses || [])].filter(Boolean);

            // Extract specific socials if not already present
            const cleanSocialUrl = (url) => typeof url === 'string' ? url.trim() : '';

            const fb = cleanSocialUrl(facebookUrl || allSocials.find(s => s.includes('facebook.com')) || '');
            const ig = cleanSocialUrl(allSocials.find(s => s.includes('instagram.com')) || '');
            const tw = cleanSocialUrl(allSocials.find(s => s.includes('twitter.com') || s.includes('x.com')) || '');
            const yt = cleanSocialUrl(allSocials.find(s => s.includes('youtube.com')) || '');
            const li = cleanSocialUrl(allSocials.find(s => s.includes('linkedin.com')) || '');
            const tt = cleanSocialUrl(allSocials.find(s => s.includes('tiktok.com')) || '');

            // Mapping Strategy:
            // 1. Phone -> First found phone
            // 2. Office Phone -> Footer found phone, else second found phone
            // 3. Email -> Best scored email
            // 4. Office Email -> Footer found email, else second found email

            const bestEmail = distinctEmails[0] || '';
            const secondEmail = scoredEmails.length > 1 ? (typeof scoredEmails[1] === 'string' ? scoredEmails[1] : scoredEmails[1].email) : '';

            // Address Parsing Logic
            let enrichedFullAddress = lead.fullAddress || '';
            let enrichedAddress = lead.address || ''; // This is the street portion as per convention
            let enrichedCity = lead.city || '';
            let enrichedState = lead.state || '';
            let enrichedZip = lead.zip || '';

            if (uniqueAddresses.length > 0) {
                const rawAddress = uniqueAddresses[0];
                enrichedFullAddress = rawAddress;

                // Identify State and Zip (Anchor)
                const stateZipRegex = /(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b[\s,.]*(\d{5})/i;
                const stateZipMatch = rawAddress.match(stateZipRegex);

                if (stateZipMatch) {
                    enrichedState = stateZipMatch[1].toUpperCase();
                    enrichedZip = stateZipMatch[2];

                    // Extract everything before the state
                    let prefix = rawAddress.substring(0, stateZipMatch.index).trim();
                    prefix = prefix.replace(/[,.\s]+$/, ''); // Clean trailing punctuation

                    if (prefix.includes(',')) {
                        // Best case: "Street Address, City"
                        const parts = prefix.split(',');
                        enrichedCity = parts[parts.length - 1].trim();
                        enrichedAddress = parts.slice(0, -1).join(',').trim();
                    } else {
                        // Guesses for when no comma exists
                        const parts = prefix.split(/\s+/);
                        if (parts.length > 2) {
                            // Guess: City is the last word, rest is street
                            enrichedCity = parts[parts.length - 1].trim();
                            enrichedAddress = parts.slice(0, -1).join(' ').trim();
                        } else if (parts.length === 2) {
                            enrichedAddress = parts[0];
                            enrichedCity = parts[1];
                        } else {
                            enrichedAddress = prefix;
                        }
                    }
                }
            }

            return {
                ...lead,
                website: url || lead.website,
                facebookUrl: fb || lead.facebookUrl || '',
                instagramUrl: ig || lead.instagramUrl || '',
                twitterUrl: tw || lead.twitterUrl || '',
                youtubeUrl: yt || lead.youtubeUrl || '',
                linkedinUrl: li || lead.linkedinUrl || '',
                tiktokUrl: tt || lead.tiktokUrl || '',
                email: bestEmail || lead.email || '',
                generalEmail: officeEmail || secondEmail || lead.generalEmail || '',
                phone: uniquePhones[0] || lead.phone || '',
                generalPhone: officePhone || uniquePhones[1] || lead.generalPhone || '',
                socials: allSocials,
                address: enrichedAddress,
                fullAddress: enrichedFullAddress,
                city: enrichedCity,
                state: enrichedState,
                zip: enrichedZip,
                status: 'Enriched',
                lastEnriched: new Date().toISOString()
            };
        } catch (error) {
            console.error('Enrichment Error:', error);
            throw error;
        }
    }
};
