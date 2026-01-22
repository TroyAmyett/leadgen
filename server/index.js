import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, 'settings.json');

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

const PHONE_REGEX = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?![a-zA-Z0-9])/g;

const cleanUrl = (url) => {
    if (!url) return null;
    let clean = url.trim();
    try {
        if (clean.includes('%')) {
            clean = decodeURIComponent(clean);
        }
    } catch (e) { }

    // Normalize protocol: if it starts with // just add https:
    if (clean.startsWith('//')) clean = 'https:' + clean;

    // Final trim to catch any decoded spaces
    return clean.trim();
};

const cleanEmail = (e) => {
    if (!e) return '';
    let clean = e.trim();

    // Handle URL encoding (like %20 for space)
    try {
        if (clean.includes('%')) {
            clean = decodeURIComponent(clean);
        }
    } catch (err) { }

    clean = clean.replace(/^[^a-zA-Z0-9]+/, '').trim();

    // Strip phone fragments like "799-7600" from start of email
    let last;
    do {
        last = clean;
        // Strip leading digits followed by dash/dot and more digits (common phone fragments)
        clean = clean.replace(/^\d+[-.]\d+/, '');
        // Strip leading noise again if left over
        clean = clean.replace(/^[^a-zA-Z0-9]+/, '');
    } while (clean !== last);

    return clean.toLowerCase();
};

async function runSearch(query) {
    const engines = [
        {
            name: 'Yahoo',
            url: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`,
            parser: (data) => {
                const $ = cheerio.load(data);
                const results = [];
                $('.algo-sr, .dd.algo, .res, .ov-a').each((i, el) => {
                    const linkEl = $(el).find('a').first();
                    let url = linkEl.attr('href');
                    const title = linkEl.text().trim();
                    const snippet = $(el).find('.compText, .compContext, .st, .d-ab').text().trim();
                    if (url && title) {
                        if (url.includes('r.search.yahoo.com')) {
                            try {
                                const urlObj = new URL(url);
                                const pathParts = urlObj.pathname.split('/');
                                const ruPart = pathParts.find(p => p.startsWith('RU='));
                                if (ruPart) url = decodeURIComponent(ruPart.substring(3));
                            } catch (e) { }
                        }
                        const isInternal = url.includes('search.yahoo.com') || url.includes('legal.yahoo.com');
                        if (!isInternal && !url.includes('javascript:')) results.push({ title, url, snippet });
                    }
                });
                return results;
            }
        },
        {
            name: 'DuckDuckGo',
            url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            parser: (data) => {
                const $ = cheerio.load(data);
                const results = [];
                $('.result').each((i, el) => {
                    const linkEl = $(el).find('.result__a');
                    const url = linkEl.attr('href');
                    const title = linkEl.text().trim();
                    const snippet = $(el).find('.result__snippet').text().trim();
                    if (url && !url.includes('duckduckgo.com') && title) {
                        if (url.startsWith('//')) results.push({ title, url: 'https:' + url, snippet });
                        else if (url.startsWith('http')) results.push({ title, url, snippet });
                    }
                });
                return results;
            }
        },
        {
            name: 'Bing',
            url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            parser: (data) => {
                const $ = cheerio.load(data);
                const results = [];
                $('.b_algo').each((i, el) => {
                    const linkEl = $(el).find('h2 a, h3 a').first();
                    const url = linkEl.attr('href');
                    const title = linkEl.text().trim();
                    const snippet = $(el).find('.b_caption p, .b_snippet, .st').text().trim();
                    if (url && !url.includes('bing.com') && title) results.push({ title, url, snippet });
                });
                return results;
            }
        }
    ];

    for (const engine of engines) {
        try {
            const response = await axios.get(engine.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                },
                timeout: 8000
            });
            const results = engine.parser(response.data);
            if (results.length > 0) return results;
        } catch (err) { }
    }
    return [];
}

async function scrapePage(targetUrl) {
    try {
        let finalUrl = targetUrl;
        let headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        };

        if (targetUrl.includes('facebook.com')) {
            // Use mbasic to avoid JS-heavy pages and 400 errors
            finalUrl = targetUrl.replace('www.facebook.com', 'mbasic.facebook.com').replace('facebook.com', 'mbasic.facebook.com');
            headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            };
        }

        const response = await axios.get(finalUrl, {
            headers,
            timeout: 20000
        });
        const html = response.data;
        const $ = cheerio.load(html);
        // Don't remove footer - many sites put contact info there!
        $('script, style, iframe').remove();

        // Helper to extract text with spacing
        const getTextWithSpaces = (root) => {
            let text = '';
            root.contents().each((_, el) => {
                if (el.type === 'text') {
                    text += $(el).text();
                } else if (el.type === 'tag') {
                    const tagName = el.name;
                    // Add space for almost any tag to prevent sticky text, 
                    // especially spans/links that often wrap individual contact items
                    const isSpacingTag = ['div', 'p', 'br', 'li', 'tr', 'footer', 'header', 'h1', 'h2', 'h3', 'nav', 'section', 'span', 'a', 'td', 'th', 'strong', 'em', 'b', 'i'].includes(tagName);

                    if (isSpacingTag) text += ' ';
                    text += getTextWithSpaces($(el));
                    if (isSpacingTag) text += ' ';
                }
            });
            return text;
        };

        const textContent = getTextWithSpaces($('body'));
        const rawEmails = textContent.match(EMAIL_REGEX) || [];
        const emails = rawEmails.map(cleanEmail).filter(Boolean);
        const mailtoLinks = [];
        $('a[href^="mailto:"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                const mail = cleanEmail(href.replace('mailto:', '').split('?')[0]);
                if (mail) mailtoLinks.push(mail);
            }
        });

        // Address Extraction
        const addressRegex = /\d{1,5}\s[A-Za-z0-9,.\s-]{5,100}\s(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b[\s,.]*\d{5}/gi;
        const addresses = textContent.match(addressRegex) || [];
        const cleanAddresses = addresses.map(a => a.replace(/\s+/g, ' ').trim());

        const phones = textContent.match(PHONE_REGEX) || [];
        const socials = [];
        $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="tiktok.com"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href) socials.push(href);
        });

        // Specific footer extraction for Office Info
        const footer = $('footer, .footer, [id*="footer"], [class*="footer"]').first();
        let footerEmails = [];
        let footerPhones = [];
        if (footer.length) {
            const footerText = getTextWithSpaces(footer);
            footerEmails = footerText.toLowerCase().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g) || [];
            footerPhones = footerText.match(PHONE_REGEX) || [];

            // Check mailto links in footer specifically
            footer.find('a[href^="mailto:"]').each((i, el) => {
                const href = $(el).attr('href');
                if (href) {
                    const mail = cleanEmail(href.replace('mailto:', '').split('?')[0]);
                    if (mail && !footerEmails.includes(mail)) footerEmails.push(mail);
                }
            });

            // Re-clean footer text emails
            footerEmails = footerEmails.map(cleanEmail).filter(Boolean);
        }

        let hostname = '';
        try { hostname = new URL(finalUrl).hostname; } catch (e) { }

        const internalLinks = [];
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.startsWith('/') || (hostname && href.includes(hostname)))) {
                try {
                    const absolute = new URL(href, finalUrl).href;
                    if (absolute !== finalUrl) internalLinks.push(absolute);
                } catch (e) { }
            }
        });
        // ---------------------------------------------------------------------
        // Facebook-specific fallback: try to scrape the "About" page for hidden emails
        // ---------------------------------------------------------------------
        let fbAdditionalEmails = [];
        if (targetUrl.includes('facebook.com')) {
            try {
                // On mbasic, the About info usually has its own link, but we can try to guess it
                const aboutUrl = finalUrl.replace(/(\/)?$/, '/about');
                const aboutResp = await axios.get(aboutUrl, {
                    headers,
                    timeout: 20000,
                });
                const $about = cheerio.load(aboutResp.data);
                const aboutText = getTextWithSpaces($about('body'));
                const aboutRaw = aboutText.match(EMAIL_REGEX) || [];
                fbAdditionalEmails = aboutRaw.map(cleanEmail).filter(Boolean);
            } catch (e) {
                // ignore failures on about page
            }
        }


        return {
            emails: [...new Set([...emails, ...mailtoLinks, ...fbAdditionalEmails])],
            phones: [...new Set(phones)],
            socials: [...new Set(socials)],
            addresses: cleanAddresses,
            officeEmails: [...new Set(footerEmails)],
            officePhones: [...new Set(footerPhones)],
            internalLinks: [...new Set(internalLinks)]
        };
    } catch (error) {
        console.error(`Error scraping ${targetUrl}:`, error.message);
        return {
            emails: [],
            phones: [],
            socials: [],
            internalLinks: [],
            officeEmails: [],
            officePhones: [],
            addresses: []
        };
    }
}

async function getSettings() {
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return { exclusionPatterns: [] };
    }
}

app.get('/settings', async (req, res) => {
    const settings = await getSettings();
    res.json(settings);
});

app.post('/settings', async (req, res) => {
    try {
        const { exclusionPatterns } = req.body;
        await fs.writeFile(SETTINGS_PATH, JSON.stringify({ exclusionPatterns }, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

async function findWebPresence(query) {
    try {
        console.log(`Fallback Search Query: ${query}`);
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            }
        });
        const $ = cheerio.load(res.data);

        let foundWebsite = null;
        let foundFacebook = null;

        const directoryDomains = [
            'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com',
            'yelp.com', 'yellowpages.com', 'mapquest.com', 'tripadvisor.com',
            'pinterest.com', 'youtube.com', 'tiktok.com', 'bbb.org', 'manta.com'
        ];

        $('.algo-sr, .dd.algo, .res, .ov-a').each((i, el) => {
            const linkEl = $(el).find('a').first();
            let link = linkEl.attr('href');

            if (link) {
                if (link.includes('r.search.yahoo.com')) {
                    try {
                        const urlObj = new URL(link);
                        const pathParts = urlObj.pathname.split('/');
                        const ruPart = pathParts.find(p => p.startsWith('RU='));
                        if (ruPart) link = decodeURIComponent(ruPart.substring(3));
                    } catch (e) { }
                }

                if (!link.startsWith('http')) return;

                // Check key domains
                if (link.includes('facebook.com') && !link.includes('/sharer') && !link.includes('/login')) {
                    if (!foundFacebook) foundFacebook = link;
                }

                // Identify potential official website
                const isDirectory = directoryDomains.some(d => link.includes(d));
                if (!foundWebsite && !isDirectory) {
                    foundWebsite = link;
                }
            }
        });

        return { website: foundWebsite, facebook: foundFacebook };
    } catch (e) {
        console.error(`Fallback search error: ${e.message}`);
        return { website: null, facebook: null };
    }
}

app.post('/scrape', async (req, res) => {
    let { url, firstName, lastName, company, city, state, facebookUrl: providedFb } = req.body;
    let facebookUrl = providedFb || null;

    // Social Search Fallback
    if (!url || url.trim() === '') {
        console.log('No URL provided. Attempting Web Presence Search...');
        let query = '';
        const location = city ? (state ? `${city} ${state}` : city) : '';

        if (company) {
            query = `${company} ${location}`;
        } else if (firstName && lastName) {
            query = `${firstName} ${lastName} ${location}`;
        }

        if (query) {
            const presence = await findWebPresence(query.trim());

            if (presence.website) {
                console.log(`Found Website: ${presence.website}`);
                url = presence.website;
            }

            if (presence.facebook && !facebookUrl) {
                console.log(`Found Facebook: ${presence.facebook}`);
                facebookUrl = presence.facebook;
            }

            if (!url && facebookUrl) {
                // If we only found FB, we can treat it as the website or just return it.
                // User asked for "Website field should update... Facebook Page should be a different field"
                // Ideally we keep them separate, but if there is NO website, maybe FB is the website?
                // Let's keep them separate as per request, unless the user forces it.
                // But for now, if no website found, we leave url strings empty but return success so the user sees the FB link.
                // Wait, if url is empty, the scraper below will fail.

                // If we have NO website but DO have a Facebook URL, we can scrape the Facebook page!
                // This allows us to find email/phone from the FB page.
                console.log('No official website found, but Facebook found. Using Facebook for scraping.');
                url = facebookUrl;
                // We set url to facebookUrl so we can scrape it, but we might want to return it as 'facebookUrl' and NOT 'website' in the final response?
                // But the 'url' var is what gets returned as 'url' (Website).
                // If we use FB as the source, it will show in the Website field. 
                // The user specifically complained about "Website field update... new field for Facebook".
                // So if we find FB but not Website, we should probably set facebookUrl = FB, and url = null.
                // EXCEPT we need to scrape *something* to get emails.
                // Let's compromise: If we scrape FB, we return it as facebookUrl. We ONLY return 'url' (Website) if it's NOT a FB link.
            }

            if (!url && !facebookUrl) {
                return res.status(400).json({ error: 'No URL provided and Web Search failed.' });
            }
        } else {
            return res.status(400).json({ error: 'URL is required (or Name/Company + City for fallback)' });
        }
    }

    try {
        console.log(`Deep Scraping: ${url}`);
        let targetUrl = url.startsWith('http') ? url : 'https://' + url;

        console.log('Phase 1: Initial Scrape');
        const firstScrape = await scrapePage(targetUrl);
        let { emails, phones, socials, internalLinks, officeEmails, officePhones, addresses } = firstScrape;
        console.log(`Phase 1 Results: E:${emails.length}, P:${phones.length}, Soc:${socials.length}, Int:${internalLinks.length}`);

        // If we scraped a Facebook page, the 'socials' might handle it or not.
        // If we scraped a real website, we might find a FB link there.
        const scrapedFb = socials.find(s => s.includes('facebook.com'));
        if (scrapedFb && !facebookUrl) {
            facebookUrl = scrapedFb;
        }

        if ((emails.length === 0 || phones.length === 0) && internalLinks.length > 0) {
            const contactUrl = internalLinks.find(l => l.toLowerCase().includes('contact')) || internalLinks[0];
            console.log(`Phase 2: Deeper Scrape -> ${contactUrl}`);
            const deeper = await scrapePage(contactUrl);
            if (deeper) {
                emails = [...emails, ...(deeper.emails || [])];
                phones = [...phones, ...(deeper.phones || [])];
                socials = [...socials, ...(deeper.socials || [])];
                officeEmails = [...officeEmails, ...(deeper.officeEmails || [])];
                officePhones = [...officePhones, ...(deeper.officePhones || [])];
                addresses = [...addresses, ...(deeper.addresses || [])];

                const deeperFb = (deeper.socials || []).find(s => s.includes('facebook.com'));
                if (deeperFb && !facebookUrl) facebookUrl = deeperFb;
            }
        }

        // ---------------------------------------------------------------------
        // SNIPPET FALLBACK: If phone/email still missing, search the web
        // ---------------------------------------------------------------------
        if (emails.length === 0 || phones.length === 0) {
            console.log('Contact info still missing. Performing snippet fallback search...');
            const location = city ? (state ? `${city} ${state}` : city) : '';
            const query = company ? `${company} ${location} contact info` : (url ? `${url} contact` : '');

            if (query) {
                const searchResults = await runSearch(query);
                searchResults.forEach(res => {
                    const snippetEmails = res.snippet.toLowerCase().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g) || [];
                    const snippetPhones = res.snippet.match(PHONE_REGEX) || [];
                    emails = [...emails, ...snippetEmails];
                    phones = [...phones, ...snippetPhones];
                });
            }
        }

        const settings = await getSettings();
        const patterns = settings.exclusionPatterns || [];

        let uniqueEmails = [...new Set(emails)]
            .map(e => cleanEmail(e))
            .filter(e => {
                if (e.includes('.png') || e.includes('.jpg') || e.includes('.jpeg') || e.includes('.svg')) return false;
                if (patterns.some(p => e.includes(p.toLowerCase()))) return false;
                return true;
            });

        let uniquePhones = [...new Set(phones)].map(p => p.trim());
        let uniqueSocials = [...new Set(socials)];

        const scoredEmails = uniqueEmails.map(email => {
            let score = 0;
            const fullEmail = email.toLowerCase();
            const [prefix, domain] = fullEmail.split('@');
            if (patterns.some(p => fullEmail.includes(p.toLowerCase()))) score -= 30;
            if (firstName && prefix.includes(firstName.toLowerCase())) score += 10;
            if (lastName && prefix.includes(lastName.toLowerCase())) score += 10;
            return { email, score };
        });

        scoredEmails.sort((a, b) => b.score - a.score);

        console.log('Phase 4: Returning Results', {
            foundOfficeEmail: !!officeEmails[0],
            foundOfficePhone: !!officePhones[0],
            emailsCount: scoredEmails.length
        });

        res.json({
            emails: scoredEmails,
            phones: [...new Set(phones)],
            socials: uniqueSocials.map(cleanUrl).filter(Boolean),
            facebookUrl: cleanUrl(facebookUrl),
            officeEmail: (officeEmails && officeEmails.length > 0) ? officeEmails[0] : null,
            officePhone: (officePhones && officePhones.length > 0) ? officePhones[0] : null,
            addresses: [...new Set(addresses)],
            url: cleanUrl((url && url.includes('facebook.com')) ? null : url),
            success: true
        });
    } catch (error) {
        console.error(`Scrape error:`, error.stack || error.message);
        res.status(500).json({ error: 'Failed to scrape website', details: error.message });
    }
});

app.post('/extract-leads', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    console.log(`Extracting leads from: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
            timeout: 15000
        });
        const $ = cheerio.load(response.data);
        const internalHostname = new URL(url).hostname;
        const leads = [];
        const seenUrls = new Set();

        const directoryDomains = [
            'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com',
            'yelp.com', 'google.com', 'bing.com', 'yahoo.com', 'amazon.com', 'apple.com'
        ];

        // Strategy: Look for external links that aren't social media or big tech
        $('a[href^="http"]').each((i, el) => {
            const $el = $(el);
            let href = $el.attr('href');
            if (!href) return;

            try {
                const urlObj = new URL(href);
                const hostname = urlObj.hostname;

                // Skip internal links
                if (hostname === internalHostname || hostname.endsWith('.' + internalHostname)) return;

                // Skip known directories/socials
                if (directoryDomains.some(d => hostname.includes(d))) return;

                // Skip common junk
                if (href.includes('.png') || href.includes('.jpg') || href.includes('.pdf')) return;

                if (seenUrls.has(hostname)) return;
                seenUrls.add(hostname);

                // Try to find a good name for the lead
                // 1. Link text if it's long enough
                // 2. Nearest heading (h1-h6)
                // 3. Parent text
                let name = $el.text().trim();

                if (name.length < 3 || name.toLowerCase().includes('website') || name.toLowerCase().includes('visit')) {
                    // Look for parent heading or bold text
                    const parent = $el.closest('div, li, section, td');
                    const heading = parent.find('h1, h2, h3, h4, h5, h6, strong, b').first().text().trim();
                    if (heading && heading.length > 2) {
                        name = heading;
                    } else if (parent.length) {
                        // Just use the first line of text in parent
                        const parentText = parent.text().trim().split('\n')[0].trim();
                        if (parentText && parentText.length > 2) name = parentText;
                    }
                }

                // If still bad name, use domain
                if (!name || name.length < 3) {
                    name = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
                }

                // Get some snippet text
                const snippet = $el.parent().text().replace(/\s+/g, ' ').substring(0, 150).trim();

                leads.push({
                    title: name.substring(0, 100),
                    url: href,
                    snippet: snippet
                });

            } catch (e) { }
        });

        console.log(`Extracted ${leads.length} leads from ${url}`);
        res.json({ success: true, results: leads });

    } catch (err) {
        console.error(`Extract Leads Error: ${err.message}`);
        res.status(500).json({ error: 'Failed to extract leads from page', details: err.message });
    }
});

app.post('/search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    console.log(`Searching for: ${query}`);
    try {
        const results = await runSearch(query);
        if (results.length > 0) {
            const enrichedResults = results.map(r => {
                const emails = r.snippet.toLowerCase().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g) || [];
                const phones = r.snippet.match(PHONE_REGEX) || [];
                return { ...r, emails, phones };
            });
            return res.json({ success: true, results: enrichedResults });
        }
        res.status(500).json({ error: 'Search failed after all attempts' });
    } catch (err) {
        res.status(500).json({ error: 'Search failed', details: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
