const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');

class APKMirror {
  constructor() {
    this.baseUrl = 'https://www.apkmirror.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': this.baseUrl + '/',
      'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  async search(query) {
    const searchParams = new URLSearchParams({
      'post_type': 'app_release',
      'searchtype': 'apk',
      's': query,
      'bundles[]': 'apkm_bundles',
      'bundles[]': 'apk_files'
    });

    const url = `${this.baseUrl}/?${searchParams.toString()}`;
    
    const html = await cloudscraper.get({
      url: url,
      headers: this.headers,
      gzip: true,
      timeout: 30000,
      followAllRedirects: true
    });

    const $ = cheerio.load(html);
    const results = [];

    $('.appRow').each((index, element) => {
      const row = $(element);
      
      const titleElement = row.find('h5.appRowTitle a.fontBlack');
      const title = titleElement.text().trim();
      const detailUrl = titleElement.attr('href');
      const fullDetailUrl = detailUrl ? (detailUrl.startsWith('http') ? detailUrl : this.baseUrl + detailUrl) : null;
      
      const version = row.find('.infoSlide-value').first().text().trim();
      
      const uploadDateRaw = row.find('.infoSlide-value .datetime_utc').attr('data-utcdate');
      let uploadDate = null;
      if (uploadDateRaw) {
        const date = new Date(uploadDateRaw);
        uploadDate = date.toISOString();
      }
      
      const fileSizeText = row.find('.infoSlide-value').eq(1).text().trim();
      const downloadsText = row.find('.infoSlide-value').eq(2).text().trim();
      const downloads = downloadsText ? parseInt(downloadsText.replace(/,/g, ''), 10) : null;
      
      const developerElement = row.find('.byDeveloper');
      const developer = developerElement.text().replace('by', '').trim();
      const developerUrl = developerElement.attr('href');
      const fullDeveloperUrl = developerUrl ? (developerUrl.startsWith('http') ? developerUrl : this.baseUrl + developerUrl) : null;

      const iconStyle = row.find('img.ellipsisText').attr('src');
      const iconUrl = iconStyle ? (iconStyle.startsWith('http') ? iconStyle : this.baseUrl + iconStyle) : null;

      if (title && fullDetailUrl) {
        results.push({
          title: title,
          detailUrl: fullDetailUrl,
          version: version,
          uploadDate: uploadDate,
          fileSize: fileSizeText,
          downloads: downloads,
          developer: developer,
          developerUrl: fullDeveloperUrl,
          iconUrl: iconUrl
        });
      }
    });

    return {
      query: query,
      totalResults: results.length,
      results: results
    };
  }

  async searchAndGetFirstDetail(query) {
    const searchResult = await this.search(query);
    
    if (searchResult.results.length === 0) {
      return {
        search: searchResult,
        detail: null
      };
    }
    
    return {
      search: searchResult,
      detail: searchResult.results[0]
    };
  }
}

(async () => {
  const scraper = new APKMirror();
  const result = await scraper.searchAndGetFirstDetail('Dana');
  console.log(JSON.stringify(result, null, 2));
})();
