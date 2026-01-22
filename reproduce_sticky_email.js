import * as cheerio from 'cheerio';

const PHONE_REGEX = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// Helper to extract text with spacing
const getTextWithSpaces = ($) => {
    const root = $('body');
    const extract = (node) => {
        let text = '';
        node.contents().each((_, el) => {
            if (el.type === 'text') {
                text += $(el).text();
            } else if (el.type === 'tag') {
                const tagName = el.name;
                const isBlock = ['div', 'p', 'br', 'li', 'tr', 'footer', 'header', 'h1', 'h2', 'h3', 'nav', 'section', 'span', 'a'].includes(tagName);
                if (isBlock) text += ' ';
                text += extract($(el));
                if (isBlock) text += ' ';
            }
        });
        return text;
    };
    return extract(root);
};

const cleanEmail = (e) => {
    let clean = e.replace(/^[-.]+/, '');
    // Strip phone fragments like "799-7600" from start of email
    // We do it repeatedly to catch multiple fragments
    let last;
    do {
        last = clean;
        clean = clean.replace(/^\d+[-.]\d+/, '');
        clean = clean.replace(/^[-.]+/, '');
    } while (clean !== last);
    return clean;
};

const html = `
    <footer>
        <div>
            <span>561-799-7600</span>
            <a href="mailto:hello@christfellowship.church">hello@christfellowship.church</a>
        </div>
    </footer>
`;

const $ = cheerio.load(html);
const text = getTextWithSpaces($);
console.log('Text Content:', JSON.stringify(text));

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
const matches = text.match(emailRegex) || [];
console.log('Raw Matches:', matches);

const cleaned = matches.map(cleanEmail);
console.log('Cleaned Matches:', cleaned);
