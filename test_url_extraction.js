import axios from 'axios';
import * as cheerio from 'cheerio';

// Test cases for different business types
const testCases = [
    { type: 'Church', name: 'Bethel Haitian Baptist Church', city: 'Palm Beach' },
    { type: 'Service', name: 'Mike\'s Plumbing', city: 'Orlando' },
    { type: 'Retail', name: 'Joe\'s Pizza', city: 'New York' }
];

async function extractSocialUrl(query) {
    try {
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            }
        });
        const $ = cheerio.load(res.data);

        let foundUrl = null;

        // Logic from server/index.js (simplified/targeted for social)
        $('.algo-sr, .dd.algo, .res, .ov-a').each((i, el) => {
            if (foundUrl) return; // Stop if found

            const linkEl = $(el).find('a').first();
            let url = linkEl.attr('href');

            if (url) {
                // Handle Yahoo Redirects
                if (url.includes('r.search.yahoo.com')) {
                    try {
                        const urlObj = new URL(url);
                        const pathParts = urlObj.pathname.split('/');
                        const ruPart = pathParts.find(p => p.startsWith('RU='));
                        if (ruPart) {
                            url = decodeURIComponent(ruPart.substring(3));
                        }
                    } catch (e) { }
                }

                // Check if it's a valid social link (facebook/instagram for now as per "site:" query intention)
                if (url.includes('facebook.com') && !url.includes('/sharer') && !url.includes('/login')) {
                    foundUrl = url;
                }
            }
        });
        return foundUrl;
    } catch (e) {
        console.error("  Error querying:", e.message);
        return null;
    }
}

async function runTests() {
    console.log("Starting Generic Social Search Extraction Tests...\n");

    for (const test of testCases) {
        // Construct a query that mimics the fallback strategy: site:facebook.com "Name" City
        const query = `site:facebook.com "${test.name}" ${test.city}`;
        console.log(`[${test.type}] Query: ${query}`);

        const result = await extractSocialUrl(query);

        if (result) {
            console.log(`  ✅ Found: ${result}`);
        } else {
            console.log(`  ❌ Failed to find a Facebook link.`);
        }
        console.log('---');
        // Mild delay to be polite
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

runTests();
