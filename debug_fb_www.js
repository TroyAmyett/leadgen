import axios from 'axios';
import fs from 'fs/promises';

const url = 'https://www.facebook.com/CalvaryFTL';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

async function check() {
    try {
        const res = await axios.get(url, { headers, timeout: 20000 });
        console.log('Status:', res.status);
        console.log('URL:', res.request.res.responseUrl);
        await fs.writeFile('calvary_www_debug.html', res.data);
        console.log('Content saved to calvary_www_debug.html');

        // Search for the phone number
        if (res.data.includes('954') && res.data.includes('977') && res.data.includes('9673')) {
            console.log('Found phone number in HTML!');
        } else {
            console.log('Phone number NOT found in HTML.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
