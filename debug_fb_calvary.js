import axios from 'axios';
import fs from 'fs/promises';

const url = 'https://mbasic.facebook.com/CalvaryFTL';
const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
};

async function check() {
    try {
        const res = await axios.get(url, { headers, timeout: 20000 });
        console.log('Status:', res.status);
        console.log('URL:', res.request.res.responseUrl);
        await fs.writeFile('calvary_debug.html', res.data);
        console.log('Content saved to calvary_debug.html');
        if (res.data.includes('login')) {
            console.log('Detected login redirect or content.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
