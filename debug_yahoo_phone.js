import axios from 'axios';
import * as cheerio from 'cheerio';

async function testYahoo() {
    const query = 'Calvary Chapel Fort Lauderdale phone number';
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            }
        });
        const $ = cheerio.load(res.data);
        const text = $('body').text();
        console.log('Snippet contains phone:', text.includes('(954) 977-9673') || text.includes('954-977-9673'));

        const phones = text.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
        console.log('Found phones:', phones);
    } catch (e) {
        console.error(e.message);
    }
}

testYahoo();
