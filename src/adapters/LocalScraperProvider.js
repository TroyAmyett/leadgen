import { EnrichmentProvider } from './EnrichmentProvider';

export class LocalScraperProvider extends EnrichmentProvider {
    constructor() {
        super();
        this.name = 'Local Scraper (Free)';
        this.endpoint = 'http://localhost:4001/scrape';
    }

    async enrichLead(lead) {
        let website = lead.website;
        let leadUpdates = {};

        // 1. Discovery Phase
        if (!website) {
            // Case A: Email Domain Fallback
            const emailToUse = lead.email || lead.generalEmail;
            if (emailToUse && emailToUse.includes('@')) {
                const domain = emailToUse.split('@')[1].toLowerCase();
                const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'msn.com', 'icloud.com', 'me.com', 'live.com', 'protonmail.com', 'bellsouth.net', 'comcast.net', 'verizon.net'];

                const settings = await fetch('http://localhost:4001/settings').then(res => res.json()).catch(() => ({ exclusionPatterns: [] }));
                const patterns = settings.exclusionPatterns || [];
                const isExcluded = patterns.some(p => domain.includes(p.toLowerCase()));

                if (!genericDomains.includes(domain) && !isExcluded) {
                    console.log(`[Local] Using email domain as website: ${domain}`);
                    website = domain;
                    leadUpdates.website = website;
                }
            }

            // Case B: Deep Website Search
            if (!website) {
                console.log(`[Local] Searching for official website: ${lead.company}...`);
                try {
                    // Use simple query: "[Church Name] [City] website" per LLM recommendation
                    const query = `${lead.company} ${lead.city || ''} ${lead.state || ''} website`.trim();
                    const searchRes = await fetch('http://localhost:4001/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query })
                    });
                    const searchData = await searchRes.json();

                    if (searchData.success && searchData.results) {
                        this.harvestSnippets(searchData.results, leadUpdates);

                        const settings = await fetch('http://localhost:4001/settings').then(res => res.json()).catch(() => ({ exclusionPatterns: [] }));
                        const patterns = settings.exclusionPatterns || [];

                        // Comprehensive directory detection
                        const isDirectorySite = (url) => {
                            const urlLower = url.toLowerCase();

                            // Known directory domains
                            const directoryDomains = [
                                'yelp.com', 'yellowpages.com', 'chamberofcommerce.com', 'manta.com',
                                'mapquest.com', 'bizapedia.com', 'whitepages.com', 'superpages.com',
                                'eintaxid.com', 'corporationwiki.com', 'zoominfo.com', 'dnb.com',
                                'nonprofitfacts.com',
                                'bbb.org', 'guidestar.org', 'opencorporates.com', 'indeed.com',
                                'glassdoor.com', 'crunchbase.com', 'bloomberg.com', 'reuters.com',
                                'wikipedia.org', 'wikidata.org', 'google.com/maps', 'bing.com/maps',
                                'findglocal.com', 'cylex.us', 'hotfrog.com', 'brownbook.net',
                                'bisprofiles.com', 'spoke.com', 'zaubee.com', 'local.com',
                                'yellowbook.com', 'citysearch.com', '411.com', 'merchantcircle.com',
                                'foursquare.com', 'insiderpages.com', 'judysbook.com', 'kudzu.com',
                                'top10place.com', 'topix.com', 'n49.com', 'ezlocal.com'
                            ];

                            // Check domain
                            if (directoryDomains.some(d => urlLower.includes(d))) return true;

                            // Extract domain for keyword checks
                            let domain = '';
                            try {
                                const urlObj = new URL(urlLower.startsWith('http') ? urlLower : 'https://' + urlLower);
                                domain = urlObj.hostname.replace(/^www\./, '');
                            } catch (e) {
                                domain = urlLower;
                            }

                            // Check for directory-like domain keywords
                            const directoryKeywords = ['top10', 'best', 'find', 'search', 'directory', 'listing', 'local', 'city', 'guide'];
                            if (directoryKeywords.some(kw => domain.includes(kw))) return true;

                            // Check URL patterns common in directory sites
                            const directoryPatterns = [
                                '/business/', '/company/', '/profile/', '/listing/', '/directory/',
                                '/local/', '/places/', '/location/', '/venue/', '/organization/'
                            ];
                            if (directoryPatterns.some(p => urlLower.includes(p))) return true;

                            return false;
                        };

                        // Smart selection: Prioritize domains that contain the company name
                        let validResult = null;

                        // Step 1: Try to find a result where company name is in the DOMAIN (not path)
                        if (lead.company) {
                            const companySlug = lead.company.toLowerCase()
                                .replace(/[^a-z0-9]/g, '') // Remove special chars
                                .substring(0, 15); // First 15 chars

                            validResult = searchData.results.find(res => {
                                const url = res.url.toLowerCase();

                                // Extract just the domain
                                let domain = '';
                                try {
                                    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
                                    domain = urlObj.hostname.replace(/^www\./, '');
                                } catch (e) {
                                    return false;
                                }

                                const domainClean = domain.replace(/[^a-z0-9]/g, '');

                                const isExcluded = patterns.some(p => url.includes(p.toLowerCase()));
                                const isDirectory = isDirectorySite(url);
                                const isSocial = domain.includes('facebook.com') || domain.includes('instagram.com') ||
                                    domain.includes('linkedin.com') || domain.includes('twitter.com');

                                // Check if company name appears in domain (not URL path!)
                                const hasCompanyInDomain = companySlug.length > 5 && domainClean.includes(companySlug);

                                return !isExcluded && !isDirectory && !isSocial && hasCompanyInDomain;
                            });
                        }

                        // Step 2: If no domain match, find first non-directory result
                        if (!validResult) {
                            validResult = searchData.results.find(res => {
                                const url = res.url.toLowerCase();
                                const isExcluded = patterns.some(p => url.includes(p.toLowerCase()));
                                const isDirectory = isDirectorySite(url);
                                const isSocial = url.includes('facebook.com') || url.includes('instagram.com') ||
                                    url.includes('linkedin.com') || url.includes('twitter.com');

                                return !isExcluded && !isDirectory && !isSocial;
                            });
                        }

                        // Step 3: If still nothing, allow directory sites (they often have contact info)
                        if (!validResult) {
                            console.log('[Local] No official site found, using directory as fallback...');
                            validResult = searchData.results.find(res => {
                                const url = res.url.toLowerCase();
                                const isExcluded = patterns.some(p => url.includes(p.toLowerCase()));
                                const isSocial = url.includes('facebook.com') || url.includes('instagram.com') ||
                                    url.includes('linkedin.com') || url.includes('twitter.com');

                                return !isExcluded && !isSocial;
                            });
                        }

                        if (validResult) {
                            let cleanUrl = validResult.url;

                            // Option 2: Clean Data. Strip path to get root domain (unless it's social)
                            const isSocial = cleanUrl.includes('facebook.com') || cleanUrl.includes('instagram.com') ||
                                cleanUrl.includes('linkedin.com') || cleanUrl.includes('twitter.com');

                            if (!isSocial) {
                                try {
                                    const urlObj = new URL(cleanUrl);
                                    cleanUrl = urlObj.origin; // https://example.com
                                } catch (e) { /* keep original if parsing fails */ }
                            }

                            website = cleanUrl;
                            leadUpdates.website = website;
                        }
                    }
                } catch (err) { console.warn('[Local] Web search failed:', err); }
            }

            // Case C: Facebook Fallback
            if (!website) {
                console.log(`[Local] Trying Facebook discovery for: ${lead.company}...`);
                try {
                    const query = `site:facebook.com "${lead.company}" ${lead.city || ''} ${lead.state || ''} info`;
                    const searchRes = await fetch('http://localhost:4001/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query })
                    });
                    const searchData = await searchRes.json();

                    if (searchData.success && searchData.results) {
                        this.harvestSnippets(searchData.results, leadUpdates);
                        const fbResult = searchData.results.find(res => res.url.includes('facebook.com/'));
                        if (fbResult) {
                            console.log(`[Local] Found Facebook page: ${fbResult.url}`);
                            website = fbResult.url;
                            leadUpdates.website = website;
                        }
                    }
                } catch (err) { console.warn('[Local] FB search failed:', err); }
            }
        }

        // 2. Scraping Phase
        if (!website) {
            console.warn('No website or social page found for local scrape.');
            return {
                ...lead,
                ...leadUpdates,
                __enrichmentMetaData: { localScrape: { success: false, error: 'No source found' } }
            };
        }

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: website,
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    company: lead.company
                })
            });

            if (!response.ok) throw new Error(`Scraper error: ${response.statusText}`);

            const data = await response.json();
            const updates = {};
            const scoredEmails = data.emails || [];

            const personalEmailObj = scoredEmails.find(e => e.score > 0);
            const genericEmailObj = scoredEmails.find(e => e.score <= 0);

            // Always populate generalEmail if we found any email
            if (genericEmailObj && !leadUpdates.generalEmail) {
                updates.generalEmail = genericEmailObj.email;
            }

            // Update main email if:
            // 1. Lead doesn't have one yet, OR
            // 2. We found a personal email (better quality)
            if (!lead.email && !leadUpdates.email) {
                if (personalEmailObj) updates.email = personalEmailObj.email;
                else if (genericEmailObj) updates.email = genericEmailObj.email;
            } else if (personalEmailObj && !lead.email?.includes(lead.firstName?.toLowerCase() || '')) {
                // Upgrade to personal email if current one isn't personal
                updates.email = personalEmailObj.email;
            }

            // 3. Pattern-Based Email Generation (Evidence Only)
            // Only generate an email if we found OTHER personal emails that establish a pattern.
            // Do NOT blind guess.
            const hasEmail = lead.email || leadUpdates.email || updates.email;

            if (!hasEmail && website && lead.firstName && lead.lastName && lead.company) {
                try {
                    const urlObj = new URL(website.startsWith('http') ? website : 'https://' + website);
                    const domain = urlObj.hostname.replace(/^www\./, '');

                    // Sanitize company name to check against domain
                    const companySlug = lead.company.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const domainClean = domain.replace(/[^a-z0-9]/g, '');
                    const checkSlug = companySlug.substring(0, 20);

                    // Domain verification
                    if (checkSlug.length > 4 && domainClean.includes(checkSlug)) {

                        // Collect all found emails to analyze pattern
                        // (From current scrape and any previous discovery)
                        const allFoundEmails = [
                            ...(data.emails || []).map(e => e.email),
                            ...(leadUpdates.generalEmail ? [leadUpdates.generalEmail] : [])
                        ];

                        // Filter out generics to find "pattern setters"
                        const genericPrefixes = ['info', 'contact', 'sales', 'support', 'admin', 'office', 'hello', 'enquiries', 'jobs', 'careers', 'hr', 'media', 'press', 'help', 'webmaster'];
                        const personalEmails = allFoundEmails.filter(email => {
                            const prefix = email.split('@')[0].toLowerCase();
                            return !genericPrefixes.includes(prefix);
                        });

                        if (personalEmails.length > 0) {
                            console.log(`[Local] Found personal emails to analyze pattern: ${personalEmails.join(', ')}`);

                            // Simple Pattern Detection
                            // We check the first valid personal email we found
                            const sample = personalEmails[0].split('@')[0].toLowerCase();
                            const f = lead.firstName.trim().toLowerCase().replace(/[^a-z]/g, '');
                            const l = lead.lastName.trim().toLowerCase().replace(/[^a-z]/g, '');
                            const fi = f[0]; // First initial

                            let generatedEmail = null;

                            // Pattern: firstname.lastname (e.g., troy.amyett)
                            if (sample.includes('.') && sample.includes(f) && sample.includes(l)) { // loose check
                                // Strict check
                                if (sample === `${f}.${l}` || sample.match(/^[a-z]+\.[a-z]+$/)) {
                                    generatedEmail = `${f}.${l}@${domain}`;
                                }
                            }
                            // Pattern: firstnamelastname (e.g., troyamyett)
                            else if (sample === `${f}${l}` || (sample.length > f.length && !sample.includes('.') && !sample.includes('_'))) {
                                generatedEmail = `${f}${l}@${domain}`;
                            }
                            // Pattern: firstinitiallastname (e.g., tamyett)
                            else if (sample === `${fi}${l}`) {
                                generatedEmail = `${fi}${l}@${domain}`;
                            }
                            // Pattern: firstname (e.g., troy)
                            else if (sample === f || sample.match(/^[a-z]+$/)) {
                                // If the sample is just a first name, it's a strong indicator
                                generatedEmail = `${f}@${domain}`;
                            }

                            if (generatedEmail) {
                                updates.email = generatedEmail;
                                updates.emailGenerated = true;
                                console.log(`[Local] Detected pattern from ${sample}, generated: ${updates.email}`);
                            }
                        } else {
                            console.log('[Local] No personal emails found to establish pattern. Skipping generation.');
                        }
                    }
                } catch (e) {
                    console.warn('[Local] Failed during pattern detection:', e.message);
                }
            }

            // 4. Pattern Discovery Search (The "Hail Mary")
            // If we STILL don't have an email, try searching specifically for ANY email at this domain 
            // to deduce the pattern (e.g. searching for "* * email @domain.com")
            const stillNoEmail = !lead.email && !leadUpdates.email && !updates.email;

            if (stillNoEmail && website && lead.firstName && lead.lastName) {
                try {
                    const urlObj = new URL(website.startsWith('http') ? website : 'https://' + website);
                    const domain = urlObj.hostname.replace(/^www\./, '');

                    console.log(`[Local] Pattern Discovery: Searching for any email at @${domain}...`);

                    // Specific query to find email patterns
                    let queries = [`email "@${domain}" contact`];

                    // Add PDF search as a second powerful technique
                    queries.push(`filetype:pdf "@${domain}"`);

                    let discoveredEmails = [];

                    // Run queries sequentially until we find a pattern
                    for (const q of queries) {
                        if (discoveredEmails.length > 0 && discoveredEmails.some(e => !['info', 'admin', 'support'].includes(e.split('@')[0]))) {
                            break; // Stop if we already found a likely personal email
                        }

                        console.log(`[Local] Pattern Discovery query: ${q}`);
                        const searchRes = await fetch('http://localhost:4001/search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: q })
                        });

                        const searchData = await searchRes.json();

                        if (searchData.success && searchData.results) {
                            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;

                            searchData.results.forEach(r => {
                                const found = r.snippet.match(emailRegex) || [];
                                found.forEach(e => {
                                    if (e.toLowerCase().includes(domain) && !discoveredEmails.includes(e.toLowerCase())) {
                                        discoveredEmails.push(e.toLowerCase());
                                    }
                                });
                            });
                        }

                        // Small delay to be polite if running multiple queries
                        if (queries.length > 1) await new Promise(r => setTimeout(r, 1000));
                    }

                    if (discoveredEmails.length > 0) {
                        // Filter generics
                        const genericPrefixes = ['info', 'contact', 'sales', 'support', 'admin', 'office', 'hello', 'enquiries', 'media', 'press'];
                        const personalEmails = discoveredEmails.filter(email => {
                            const prefix = email.split('@')[0].toLowerCase();
                            return !genericPrefixes.includes(prefix);
                        });

                        if (personalEmails.length > 0) {
                            console.log(`[Local] Pattern Discovery found: ${personalEmails.join(', ')}`);

                            // Deduce pattern from the first valid finding
                            const sample = personalEmails[0].split('@')[0].toLowerCase();
                            const f = lead.firstName.trim().toLowerCase().replace(/[^a-z]/g, '');
                            const l = lead.lastName.trim().toLowerCase().replace(/[^a-z]/g, '');
                            const fi = f[0];

                            let generatedEmail = null;

                            // Simple heuristic matching
                            if (sample.includes('.') && sample.length > 3) {
                                generatedEmail = `${f}.${l}@${domain}`; // Assume dot separator
                            } else if (sample.length === (f.length + l.length)) {
                                generatedEmail = `${f}${l}@${domain}`; // Assume concat
                            } else if (sample.length === (1 + l.length)) {
                                generatedEmail = `${fi}${l}@${domain}`; // Assume initial+last
                            } else if (sample.length === f.length) {
                                generatedEmail = `${f}@${domain}`; // Assume first only
                            }

                            if (generatedEmail) {
                                updates.email = generatedEmail;
                                updates.emailGenerated = true;
                                console.log(`[Local] Discovered pattern from search, generated: ${updates.email}`);
                            }
                        }
                    }
                } catch (err) {
                    console.warn('[Local] Pattern discovery failed:', err);
                }
            }

            if (data.phones && data.phones.length > 0) {
                // strict filter: remove duplicates
                const uniquePhones = [...new Set(data.phones)];

                const validPhones = uniquePhones.filter(p => {
                    const digits = p.replace(/\D/g, '');
                    return digits.length >= 10 && !digits.startsWith('0') && !digits.startsWith('10') && !digits.startsWith('202');
                });

                if (validPhones.length > 0) {
                    // Update Phone: Always prioritize scraped data over snippet data
                    updates.phone = validPhones[0];

                    // Prioritize Office Phone (from footer) if available
                    if (data.officePhone) {
                        updates.generalPhone = data.officePhone;
                    } else if (validPhones.length > 1) {
                        updates.generalPhone = validPhones[1];
                    } else {
                        updates.generalPhone = validPhones[0];
                    }
                }
            }

            // Prioritize Office Email (from footer)
            if (data.officeEmail) {
                updates.generalEmail = data.officeEmail;
            }

            // Address Processing
            const sourceAddresses = data.addresses || [];
            if (sourceAddresses.length > 0) {
                const rawAddress = sourceAddresses[0];

                // Parse: "123 Main St, West Palm Beach, FL 33411"
                // Regex to capture City, State, Zip at the END of the string
                const parseRegex = /([A-Za-z\s.-]+)[,.\s]+(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b[\s,.]*(\d{5})/i;

                const match = rawAddress.match(parseRegex);
                if (match) {
                    // match[1] is likely "West Palm Beach" or "St, West Palm Beach"
                    // We need to be careful about Street vs City.
                    // If the lead already has a City, check if it matches.

                    const stateFound = match[2].toUpperCase();
                    const zipFound = match[3];

                    // Attempt to extract City from Group 1
                    // Split by comma if possible
                    let cityCandidate = match[1].trim();
                    if (cityCandidate.includes(',')) {
                        const parts = cityCandidate.split(',');
                        cityCandidate = parts[parts.length - 1].trim(); // Take last part
                    }

                    // Update Lead
                    updates.state = stateFound;
                    updates.zip = zipFound;

                    // Only update City if it looks like a city (no numbers)
                    if (!/\d/.test(cityCandidate) && cityCandidate.length > 2) {
                        updates.city = cityCandidate;
                    }

                    updates.address = rawAddress; // Store full string
                }
            }

            return {
                ...lead,
                ...leadUpdates,
                ...updates,
                leadSource: (updates.email || updates.phone || leadUpdates.phone || leadUpdates.email) ? 'Enriched (Free)' : lead.leadSource,
                __enrichmentMetaData: {
                    success: true,
                    foundEmails: data.emails,
                    foundPhones: data.phones,
                    foundSocials: data.socials
                }
            };

        } catch (error) {
            console.warn('Scraper failed, but keeping discovery info:', error.message);
            return {
                ...lead,
                ...leadUpdates,
                __enrichmentMetaData: { localScrape: { success: false, error: error.message } }
            };
        }
    }

    harvestSnippets(results, leadUpdates) {
        results.forEach(res => {
            if (res.emails && res.emails.length > 0 && !leadUpdates.generalEmail) {
                leadUpdates.generalEmail = res.emails[0];
                if (!leadUpdates.email) leadUpdates.email = res.emails[0];
            }
            if (res.phones && res.phones.length > 0) {
                if (!leadUpdates.generalPhone) leadUpdates.generalPhone = res.phones[0];
                if (!leadUpdates.phone) leadUpdates.phone = res.phones[0];
            }
        });
    }
}
