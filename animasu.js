const axios = require('axios');
const cheerio = require('cheerio');

class Animasu {
  constructor() {
    this.baseUrl = 'https://v1.animasu.app';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    };
  }

  async search(query) {
    const { data } = await axios.get(`${this.baseUrl}/?s=${encodeURIComponent(query)}`, { headers: this.headers });
    const $ = cheerio.load(data);
    const results = [];

    for (const el of $('.listupd .bs').toArray()) {
      const link = $(el).find('a');
      const detailUrl = link.attr('href');
      
      const detail = await this.getDetail(detailUrl);
      
      results.push({
        title: link.attr('title') || link.find('.tt').text().trim(),
        detailUrl: detailUrl,
        thumbnail: $(el).find('.limit img').attr('src'),
        type: $(el).find('.typez').text().trim(),
        episode: $(el).find('.epx').text().trim(),
        detail: detail
      });
    }

    return results;
  }

  async getDetail(detailUrl) {
    const { data } = await axios.get(detailUrl, { headers: this.headers });
    const $ = cheerio.load(data);
    
    const downloadLinks = [];
    $('.soraddlx .soraurlx').each((i, el) => {
      const quality = $(el).find('strong').text().trim();
      const links = [];
      $(el).find('a').each((j, linkEl) => {
        links.push({
          server: $(linkEl).text().trim(),
          url: $(linkEl).attr('href')
        });
      });
      if (quality && links.length) downloadLinks.push({ quality, links });
    });

    const genres = [];
    $('.infox .spe a[href*="/genre/"]').each((i, el) => {
      genres.push($(el).text().trim());
    });

    return {
      title: $('h1').first().text().trim(),
      alternativeTitle: $('.alter').text().trim(),
      description: $('.desc p').text().trim(),
      genres: genres,
      status: $('.spe span:contains("Status:")').text().replace('Status:', '').trim(),
      type: $('.spe span:contains("Jenis:")').text().replace('Jenis:', '').trim(),
      duration: $('.spe span:contains("Durasi:")').text().replace('Durasi:', '').trim(),
      studio: $('.spe a[href*="/studio/"]').text().trim(),
      author: $('.spe a[href*="/penulis/"]').text().trim(),
      released: $('.spe span:contains("Rilis:")').text().replace('Rilis:', '').trim(),
      updated: $('.spe time').text().trim(),
      rating: $('.rating strong').text().replace('Rating', '').trim(),
      trailer: $('.tply iframe').attr('src'),
      downloadLinks: downloadLinks
    };
  }
}

(async () => {
  const scraper = new Animasu();
  const result = await scraper.search('boruto');
  console.log(JSON.stringify(result, null, 2));
})();
