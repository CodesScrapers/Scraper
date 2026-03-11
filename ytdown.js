const axios = require('axios');
const FormData = require('form-data');
const { randomUUID } = require('crypto');

class YTDown {
  constructor() {
    this.baseUrl = 'https://app.ytdown.to';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/id15/',
      'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest'
    };
    this.cookies = {
      'PHPSESSID': randomUUID().replace(/-/g, ''),
      '_ga': 'GA1.1.' + Math.floor(Math.random() * 1000000000) + '.' + Math.floor(Date.now() / 1000)
    };
  }

  generateSession() {
    this.cookies.PHPSESSID = randomUUID().replace(/-/g, '');
    this.cookies._ga = 'GA1.1.' + Math.floor(Math.random() * 1000000000) + '.' + Math.floor(Date.now() / 1000);
  }

  getCookieString() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async getVideoInfo(url) {
    this.generateSession();
    
    const form = new FormData();
    form.append('url', url);

    const response = await axios.post(`${this.baseUrl}/proxy.php`, form, {
      headers: {
        ...this.headers,
        ...form.getHeaders(),
        'Cookie': this.getCookieString()
      }
    });

    if (response.headers['set-cookie']) {
      response.headers['set-cookie'].forEach(cookie => {
        const [key, value] = cookie.split(';')[0].split('=');
        this.cookies[key] = value;
      });
    }

    return response.data;
  }
}

(async () => {
  const scraper = new YTDown();
  const result = await scraper.getVideoInfo('https://www.youtube.com/watch?v=APtV8Je_cl4');
  console.log(JSON.stringify(result, null, 2));
})();


