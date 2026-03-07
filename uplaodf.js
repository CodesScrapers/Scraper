const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadFile(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://uploadf.com',
    'Referer': 'https://uploadf.com/id/',
    'X-Requested-With': 'XMLHttpRequest',
    ...formData.getHeaders()
  };

  const response = await axios.post('https://uploadf.com/fileup.php', formData, {
    headers: headers
  });

  return {
    success: response.data.FLG,
    fileName: 'https://uploadf.com/s/' + response.data.NAME,
    originalName: response.data.NRF,
    raw: response.data
  };
}

(async () => {
  const result = await uploadFile('images.png');
  console.log(JSON.stringify(result, null, 2));
})();

