const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class Sightengine {
    constructor() {
        this.baseUrl = 'https://api.sightengine.com/1.0/check.json';
        this.headers = {
            'Accept': '*/*',
            'Referer': 'https://sightengine.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"'
        };
    }

    async uplot(imagePath) {
        const formData = new FormData();
        formData.append('media', fs.createReadStream(imagePath));
        formData.append('models', 'genai,deepfake');
        formData.append('opt_generators', 'on');

        const response = await axios.post(this.baseUrl, formData, {
            headers: {
                ...this.headers,
                ...formData.getHeaders()
            }
        });

        return response.data;
    }
}

(async () => {
    const scraper = new Sightengine();
    const result = await scraper.uplot('image.png');
    console.log(result);
})();
