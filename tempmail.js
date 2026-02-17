const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://akunlama.com';
const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'referer': 'https://akunlama.com/',
    'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
};

const generateRecipient = () => crypto.randomBytes(8).toString('hex').substring(0, 10);
const extractToken = (html) => html.match(/token=([^"&\\]+)/)?.[1];
const cleanHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

(async () => {
    const recipient = generateRecipient();
    console.log(`Email: ${recipient}@akunlama.com\n`);
    
    let lastCount = 0;
    const interval = setInterval(async () => {
        const { data: inbox } = await axios.get(`${BASE_URL}/api/list`, {
            params: { recipient },
            headers: { ...headers, referer: `https://akunlama.com/inbox/${recipient}/list` }
        });
        
        if (inbox.length > lastCount) {
            for (const msg of inbox.slice(lastCount)) {
                console.log(`Dari: ${msg.message?.headers?.from}`);
                console.log(`Subjek: ${msg.message?.headers?.subject}`);
                console.log(`Preview: ${msg.preview}`);
                
                const { data: html } = await axios.get(`${BASE_URL}/api/getHtml`, {
                    params: { region: msg.storage.region, key: msg.storage.key },
                    headers: { ...headers, referer: `https://akunlama.com/inbox/${recipient}/message/${msg.storage.region}/${msg.storage.key}` }
                });
                
                const cleanText = cleanHtml(html);
                console.log(`Isi: ${cleanText}`);
                
                const token = extractToken(html);
                if (token) {
                    console.log(`Token: ${token}`);
                    clearInterval(interval);
                    process.exit(0);
                }
                console.log('---');
            }
            lastCount = inbox.length;
        }
    }, 10000);
})();

// Tags: javascript, tools