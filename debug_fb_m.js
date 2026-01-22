import axios from 'axios';
import fs from 'fs/promises';

const url = 'https://m.facebook.com/CalvaryFTL/about';
const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

async function check() {
    try {
        const res = await axios.get(url, { headers, timeout: 20000 });
        console.log('Status:', res.status);
        await fs.writeFile('calvary_m_about_debug.html', res.data);
        console.log('Content saved');
        if (res.data.includes('954') && res.data.includes('977') && res.data.includes('9673')) {
            console.log('Found phone number!');
        } else {
            console.log('NOT found. Checking if login page...');
            if (res.data.includes('login')) console.log('This is a login page.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
