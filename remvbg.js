const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');

class RemoveBG {
  constructor() {
    this.baseUrl = 'https://removal.ai';
    this.apiUrl = 'https://api.removal.ai';
    this.ajaxUrl = 'https://removal.ai/wp-admin/admin-ajax.php';
    this.cookies = this.generateCookies();
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/upload/',
      'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': this.cookies
    };
    this.webToken = null;
  }

  generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0, length);
  }

  generateTimestamp() {
    return Date.now();
  }

  generateCookies() {
    const ga1 = 'GA1.1.' + this.generateRandomString(8) + '.' + this.generateTimestamp().toString().slice(0, 10);
    const ga2 = 'GS2.1.s' + this.generateTimestamp() + '$o1$g0$t' + this.generateTimestamp() + '$j60$l0$h0';
    const ga3 = 'GS2.1.s' + (this.generateTimestamp() - 1000) + '$o1$g1$t' + this.generateTimestamp() + '$j3$l0$h0';
    const phpsessid = this.generateRandomString(26);
    
    return `PHPSESSID=${phpsessid}; lang=en; _ga=${ga1}; _ga_W308RS13QN=${ga2}; _ga_XECZHS4N4G=${ga3}`;
  }

  async getWebToken(security = '249c6a42bb') {
    const response = await axios.get(`${this.ajaxUrl}?action=ajax_get_webtoken&security=${security}`, {
      headers: this.headers
    });
    if (response.data.success) {
      this.webToken = response.data.data.webtoken;
    }
    return response.data;
  }

  async removeBackground(imageBuffer, options = {}) {
    const formData = new FormData();
    formData.append('image_file', imageBuffer, { filename: options.filename || 'image.png' });
    if (options.format) formData.append('format', options.format);

    const response = await axios.post(`${this.apiUrl}/3.0/remove`, formData, {
      headers: {
        ...this.headers,
        ...formData.getHeaders(),
        'Web-Token': this.webToken
      },
      responseType: 'json'
    });

    return response.data;
  }

  async removeBackgroundFromFile(filePath, options = {}) {
    const imageBuffer = fs.readFileSync(filePath);
    options.filename = filePath.split('/').pop();
    if (!this.webToken) await this.getWebToken();
    return this.removeBackground(imageBuffer, options);
  }
}

(async () => {
  const scraper = new RemoveBG();
  const result = await scraper.removeBackgroundFromFile('images.png', { format: 'png' });
  console.log(JSON.stringify(result, null, 2));
})();
