const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class WhatMusic {
  constructor() {
    this.baseUrl = 'https://api.doreso.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': 'https://aha-music.com',
      'Referer': 'https://aha-music.com/',
      'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    };
  }

  async uploadFile(filePath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        ...this.headers,
        ...formData.getHeaders()
      }
    });

    return {
      success: true,
      uploadId: response.data.data.id,
      name: response.data.data.name,
      duration: response.data.data.duration,
      uri: response.data.data.uri,
      data: response.data.data
    };
  }

  async getResult(uploadId) {
    const response = await axios.get(`${this.baseUrl}/file/${uploadId}`, {
      headers: this.headers
    });

    const data = response.data.data[0];
    
    const results = [];
    if (data.results && data.results.music) {
      data.results.music.forEach(item => {
        if (item.result) {
          const track = item.result;
          results.push({
            title: track.title,
            acrid: track.acrid,
            score: track.score,
            durationMs: track.duration_ms,
            genres: track.genres ? track.genres.map(g => g.name) : [],
            artists: track.artists ? track.artists.map(a => a.name) : [],
            album: track.album ? track.album.name : null,
            releaseDate: track.release_date,
            label: track.label,
            externalIds: track.external_ids || {},
            externalMetadata: track.external_metadata || {}
          });
        }
      });
    }

    return {
      success: true,
      uploadId: data.id,
      name: data.name,
      duration: data.duration,
      state: data.state,
      total: data.total,
      results: results,
      data: data
    };
  }

  async upload(filePath, interval = 3000, maxAttempts = 20) {
    const upload = await this.uploadFile(filePath);
    const uploadId = upload.uploadId;
    
    let attempts = 0;
    while (attempts < maxAttempts) {
      const result = await this.getResult(uploadId);
      
      if (result.state === 1 && result.results.length > 0) {
        return {
          upload: upload,
          result: result
        };
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return {
      upload: upload,
      result: await this.getResult(uploadId),
      timeout: true
    };
  }
}

(async () => {
  const scraper = new WhatMusic();
  const result = await scraper.upload('Menunggu.mp3');
  console.log(JSON.stringify(result, null, 2));
})();
