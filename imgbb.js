const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');

const generateAuthToken = (timestamp) => {
    const hash = crypto.createHash('sha1');
    hash.update(timestamp.toString());
    return hash.digest('hex');
};

const uploadImage = async (imagePath) => {
    const timestamp = Date.now();
    const authToken = generateAuthToken(timestamp);
    
    const formData = new FormData();
    formData.append('source', fs.readFileSync(imagePath), {
        filename: 'image.png',
        contentType: 'image/png'
    });
    formData.append('type', 'file');
    formData.append('action', 'upload');
    formData.append('timestamp', timestamp);
    formData.append('auth_token', authToken);

    const response = await axios.post('https://imgbb.com/json', formData, {
        headers: {
            ...formData.getHeaders(),
            'Accept': 'application/json',
            'Referer': 'https://imgbb.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        }
    });

    const cleanUrls = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && obj[key].includes('\\/')) {
                obj[key] = obj[key].replace(/\\\//g, '/');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                cleanUrls(obj[key]);
            }
        }
        return obj;
    };

    return {
        data: cleanUrls(response.data),
    };
};

(async () => {
    const result = await uploadImage('image.png');
    console.log(JSON.stringify(result, null, 2));
})();
