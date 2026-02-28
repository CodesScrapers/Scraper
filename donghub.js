const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

class Donghub {
  constructor() {
    this.baseUrl = 'https://donghub.vip';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    this.cookies = this.generateCookies();
  }

  generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0, length);
  }

  generateTimestamp() {
    return Date.now();
  }

  generateCookies() {
    const ga1 = this.generateRandomString(8) + '.' + this.generateRandomString(10);
    const ga2 = 'GS2.1.s' + this.generateTimestamp() + '$o1$g1$t' + (this.generateTimestamp() + 1000) + '$j35$l0$h0';
    const hstCfa = this.generateTimestamp() + '3385';
    const hstCla = this.generateTimestamp() + '3385';
    const hstCmu = this.generateTimestamp() + '3385';
    const dtsu = '6D00' + this.generateTimestamp() + '67439490D2359A715FA14';
    const pubcid = this.generateRandomString(8) + '-' + this.generateRandomString(4) + '-' + this.generateRandomString(4) + '-' + this.generateRandomString(4) + '-' + this.generateRandomString(12);
    const ccId = this.generateRandomString(16) + 'cd685c2ab8ae6766';
    const panoramaId = this.generateRandomString(64);
    
    return `_ga=GA1.1.${ga1}; HstCfa5009307=${hstCfa}; HstCla5009307=${hstCla}; HstCmu5009307=${hstCmu}; HstPn5009307=1; HstPt5009307=1; HstCnv5009307=1; HstCns5009307=1; __dtsu=${dtsu}; _pubcid=${pubcid}; _cc_id=${ccId}; panoramaId_expiry=${this.generateTimestamp() + 86400000}; panoramaId=${panoramaId}; panoramaIdType=panoDevice; _ga_BC9Q6DVLH9=${ga2}`;
  }

  async getEpisodeVideoUrl(episodeUrl) {
    const response = await axios.get(episodeUrl, {
      headers: {
        ...this.headers,
        'Cookie': this.cookies
      }
    });
    
    const $ = cheerio.load(response.data);
    const videoSources = [];
    
    $('iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        videoSources.push({
          type: 'iframe',
          url: src,
          provider: src.includes('youtube') ? 'youtube' : src.includes('drive') ? 'gdrive' : 'embed'
        });
      }
    });
    
    $('video source').each((i, el) => {
      const src = $(el).attr('src');
      const type = $(el).attr('type');
      if (src) {
        videoSources.push({
          type: 'video',
          url: src,
          format: type || 'video/mp4'
        });
      }
    });
    
    $('a[href*=".mp4"], a[href*=".mkv"], a[href*=".m3u8"]').each((i, el) => {
      const src = $(el).attr('href');
      videoSources.push({
        type: 'direct',
        url: src,
        quality: $(el).text().match(/\d+p/)?.[0] || 'unknown'
      });
    });
    
    const playerScript = $('script:contains("player.src")').text();
    if (playerScript) {
      const matches = playerScript.match(/https?:\/\/[^\s"']+\.(?:mp4|mkv|m3u8)[^\s"']*/g);
      if (matches) {
        matches.forEach(url => {
          videoSources.push({
            type: 'script',
            url: url,
            quality: 'unknown'
          });
        });
      }
    }
    
    return videoSources;
  }

  async search(query) {
    const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        ...this.headers,
        'Cookie': this.cookies,
        'Referer': this.baseUrl + '/'
      }
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    $('.listupd article.bs').each((i, el) => {
      const article = $(el);
      const link = article.find('a');
      const title = link.attr('title') || link.find('h2').text();
      const url = link.attr('href');
      const img = article.find('img').attr('src');
      const type = article.find('.typez').text();
      const status = article.find('.epx').text();
      const sub = article.find('.sb').text();
      const hotbadge = article.find('.hotbadge').length > 0;
      
      results.push({
        title: title,
        url: url,
        image: img,
        type: type,
        status: status,
        subtitle: sub,
        hot: hotbadge
      });
    });
    
    return {
      query: query,
      results: results
    };
  }

  async getDetail(url) {
    const response = await axios.get(url, {
      headers: {
        ...this.headers,
        'Cookie': this.cookies,
        'Referer': this.baseUrl + '/'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    const detail = {
      title: $('.entry-title').first().text(),
      url: url,
      image: $('.thumb img').attr('src') || $('.bigcover img').attr('src'),
      alternative: $('.alter').text(),
      status: $('.spe span:contains("Status:")').text().replace('Status:', '').trim(),
      network: $('.spe a[href*="network"]').text(),
      released: $('.spe span:contains("Released:")').text().replace('Released:', '').trim(),
      duration: $('.spe span:contains("Duration:")').text().replace('Duration:', '').trim(),
      country: $('.spe a[href*="country"]').text(),
      type: $('.spe span:contains("Type:")').text().replace('Type:', '').trim(),
      episodes: $('.spe span:contains("Episodes:")').text().replace('Episodes:', '').trim(),
      updated: $('.spe time[itemprop="dateModified"]').text() || $('.spe span:contains("Updated on:")').text().replace('Updated on:', '').trim(),
      genres: [],
      synopsis: $('.entry-content p').first().text().replace(/\n/g, ' ').trim(),
      episodeList: []
    };
    
    $('.genxed a').each((i, el) => {
      detail.genres.push($(el).text());
    });
    
    const episodePromises = [];
    
    $('.eplister ul li').each((i, el) => {
      const episodeLink = $(el).find('a');
      const episodeUrl = episodeLink.attr('href');
      const episodeNum = $(el).find('.epl-num').text();
      const episodeTitle = $(el).find('.epl-title').text();
      const episodeDate = $(el).find('.epl-date').text();
      const episodeSub = $(el).find('.epl-sub .status').text();
      
      episodePromises.push(
        this.getEpisodeVideoUrl(episodeUrl).then(videoSources => {
          return {
            episode: episodeNum,
            title: episodeTitle,
            url: episodeUrl,
            releaseDate: episodeDate,
            subtitle: episodeSub,
            videoSources: videoSources
          };
        })
      );
    });
    
    detail.episodeList = await Promise.all(episodePromises);
    
    return detail;
  }

  async scrape(query) {
    const searchResults = await this.search(query);
    
    if (searchResults.results.length === 0) {
      return {
        search: searchResults,
        detail: {}
      };
    }
    
    const detail = await this.getDetail(searchResults.results[0].url);
    
    return {
      search: searchResults,
      detail: detail
    };
  }
}

(async () => {
  const scraper = new Donghub();
  const result = await scraper.scrape('way of choices');
  console.log(JSON.stringify(result, null, 2));
})();
