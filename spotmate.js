const axios = require('axios');
const { JSDOM } = require('jsdom');

class Spotmate {
  constructor() {
    this.baseUrl = 'https://spotmate.online';
    this.apiUrl = 'https://spotmate.online/getTrackData';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/en1',
      'Content-Type': 'application/json'
    };
    this.cookies = '';
    this.csrfToken = '';
  }

  async getCsrfToken() {
    const response = await axios.get(this.baseUrl + '/en1', {
      headers: {
        'User-Agent': this.headers['User-Agent']
      }
    });

    const cookies = response.headers['set-cookie'];
    if (cookies) {
      this.cookies = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) {
      this.csrfToken = metaToken;
    }

    const scriptToken = response.data.match(/X-CSRF-TOKEN['"]?\s*:\s*['"]([a-zA-Z0-9]+)['"]/);
    if (scriptToken) {
      this.csrfToken = scriptToken[1];
    }

    return {
      cookies: this.cookies,
      csrfToken: this.csrfToken
    };
  }

  async getTrackData(spotifyUrl) {
    await this.getCsrfToken();

    const payload = {
      spotify_url: spotifyUrl
    };

    const response = await axios.post(this.apiUrl, payload, {
      headers: {
        ...this.headers,
        'Cookie': this.cookies,
        'X-CSRF-TOKEN': this.csrfToken
      }
    });

    return response.data;
  }
}

(async () => {
  const scraper = new Spotmate();
  const result = await scraper.getTrackData('https://open.spotify.com/intl-id/track/6iEFaY4nLQS3FwhiibKLWM?si=34ad1d63fc5a47da');
  console.log(JSON.stringify(result, null, 2));
})();

