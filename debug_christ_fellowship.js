import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:4001/scrape', {
            url: 'https://www.christfellowship.church/locations/palm-beach-gardens',
            company: 'Christ Fellowship Church'
        });
        const data = res.data;
        console.log('Office Email:', data.officeEmail);
        console.log('Emails Found:', data.emails.map(e => e.email));
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

test();
