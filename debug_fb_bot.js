import axios from 'axios';
import fs from 'fs/promises';

const url = 'https://mbasic.facebook.com/CalvaryFTL';
const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function check() {
    try {
        const res = await axios.get(url, { headers, timeout: 20000 });
        console.log('Status:', res.status);
        console.log('URL:', res.request.res.responseUrl);
        if (res.data.includes('login')) {
            console.log('STILL login page.');
        } else {
            console.log('BYPASSED login page!');
            if (res.data.includes('954') && res.data.includes('977') && res.data.includes('9673')) {
                console.log('Found phone number!');
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
