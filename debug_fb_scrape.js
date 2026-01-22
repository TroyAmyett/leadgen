import axios from 'axios';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';

const targetUrl = 'https://mbasic.facebook.com/thepocc/';

async function testScrape() {
    try {
        console.log(`Scraping ${targetUrl}...`);
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 20000
        });

        const html = response.data;
        await fs.writeFile('fb_debug.html', html);
        console.log('Saved fb_debug.html');

        const $ = cheerio.load(html);

        // Basic Text extraction test
        const bodyText = $('body').text();
        console.log('Body length:', bodyText.length);
        console.log('Snippet:', bodyText.substring(0, 500));

        // Look for specific email
        // I don't know the email, but I can look for @ symbol
        const emails = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g);
        console.log('Found emails:', emails);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testScrape();
