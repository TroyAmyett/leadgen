import axios from 'axios';
import * as cheerio from 'cheerio';

async function testQuery() {
    try {
        const query = 'site:facebook.com "Bethel Haitian Baptist Church" Palm Beach';
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            }
        });
        const $ = cheerio.load(res.data);
        console.log("Algo-sr OuterHTML Sample:");
        console.log($('.algo-sr').first().html());
    } catch (e) {
        console.log("Error:", e.message);
    }
}

testQuery();
