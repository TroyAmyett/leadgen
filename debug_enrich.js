import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:4001/scrape', {
            url: 'https://calvaryftl.org/',
            company: 'Calvary Chapel Fort Lauderdale'
        });
        const data = res.data;
        console.log('Office Phone:', data.officePhone);
        console.log('Office Email:', data.officeEmail);
        console.log('Main Email:', data.emails[0]?.email);
        console.log('Total Phones:', data.phones.length);
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

test();
