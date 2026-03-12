const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class ImgUpscaler {
  constructor() {
    this.baseUrl = 'https://get1.imglarger.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': 'https://imgupscaler.com',
      'Referer': 'https://imgupscaler.com/'
    };
  }

  async uploadImage(imagePath) {
    const form = new FormData();
    const filename = path.basename(imagePath);
    form.append('myfile', fs.createReadStream(imagePath), filename);
    form.append('scaleRadio', '2');

    const response = await axios.post(`${this.baseUrl}/api/UpscalerNew/UploadNew`, form, {
      headers: {
        ...this.headers,
        ...form.getHeaders()
      }
    });

    return response.data;
  }

  async checkStatus(code) {
    const response = await axios.post(`${this.baseUrl}/api/UpscalerNew/CheckStatusNew`, {
      code: code,
      scaleRadio: 2
    }, {
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  async waitForResult(code) {
    let result = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      result = await this.checkStatus(code);
      
      if (result.code === 200 && result.data) {
        if (result.data.download_url || result.data.img_url || result.data.status === 'success') {
          return result;
        }
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    throw new Error('Timeout after ' + maxAttempts + ' attempts');
  }

  async process(imagePath) {
    const upload = await this.uploadImage(imagePath);
    const result = await this.waitForResult(upload.data.code);
    
    return {
      upload,
      result
    };
  }
}

(async () => {
  const scraper = new ImgUpscaler();
  const result = await scraper.process('images.png');
  console.log(JSON.stringify(result, null, 2));
})();

