import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugYahoo() {
    try {
        const query = "apple";
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            }
        });
        console.log("HTML Length:", res.data.length);
        const $ = cheerio.load(res.data);
        console.log("H3 Count:", $('h3').length);
        console.log("Algo-sr Count:", $('.algo-sr').length);
        console.log("Result-title Count:", $('.result-title').length);
        if ($('h3').length > 0) {
            console.log("First H3:", $('h3').first().text());
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

debugYahoo();
