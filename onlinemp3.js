const axios = require('axios');
const cheerio = require('cheerio');

class OnlineMP3 {
  constructor() {
    this.baseUrl = 'https://onlymp3.org';
    this.apiUrl = 'https://goapis.net';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://onlymp3.org/en6/youtube-to-mp3',
      'Origin': 'https://onlymp3.org'
    };
  }

  extractVideoId(input) {
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      return match ? match[1] : null;
    }
    return input;
  }

  async search(query, lang = 'en6') {
    const searchUrl = `${this.baseUrl}/${lang}/search/${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': this.headers['User-Agent'],
        'Accept': 'text/html',
        'Accept-Language': this.headers['Accept-Language']
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.card.playList').each((i, el) => {
      const card = $(el);
      const img = card.find('img').attr('src');
      const title = card.find('p b:contains("Title:")').parent().text().replace('Title:', '').trim();
      const durationText = card.find('p b:contains("Duration:")').parent().text().replace('Duration:', '').trim();
      const downloadButton = card.find('.Bdownload');
      const videoId = downloadButton.data('token');
      const sourceUrl = downloadButton.data('source') || downloadButton.attr('href');

      if (videoId) {
        results.push({
          title: title,
          videoId: videoId,
          thumbnail: img,
          duration: durationText,
          youtubeUrl: `https://youtu.be/${videoId}`,
          sourceUrl: sourceUrl
        });
      }
    });

    return {
      success: true,
      query: query,
      total: results.length,
      results: results
    };
  }

  async getMP3(videoIdOrUrl) {
    const videoId = this.extractVideoId(videoIdOrUrl);

    const response = await axios.get(`${this.apiUrl}/api/v2/convert`, {
      params: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        format: 'mp3'
      },
      headers: this.headers,
    });

    if (response.data) {
      const downloadUrl = 
        response.data.url || 
        response.data.download_url || 
        response.data.downloadUrl || 
        response.data.link ||
        response.data.file;

      if (downloadUrl) {
        return {
          success: true,
          videoId: videoId,
          downloadUrl: downloadUrl,
          sourceUrl: `${this.apiUrl}/api/v2/convert?url=https://www.youtube.com/watch?v=${videoId}&format=mp3`
        };
      }
    }

    return videoId;
  }
}

(async () => {
  const scraper = new OnlineMP3();
  const result = await scraper.search('kita sih nyantai');
  console.log(JSON.stringify(result, null, 2));
})();


