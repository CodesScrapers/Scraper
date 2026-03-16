const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');

class GSMSArena {
  constructor() {
    this.baseUrl = 'https://www.gsmarena.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    };
  }

  async get(query) {
    const searchUrl = `${this.baseUrl}/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(query)}`;
    const searchHtml = await cloudscraper.get({ url: searchUrl, headers: this.headers });
    const $ = cheerio.load(searchHtml);
    const results = [];

    $('.makers ul li').each((i, el) => {
      const link = $(el).find('a');
      const name = link.find('span').text().trim();
      const detailUrl = link.attr('href');
      const image = link.find('img').attr('src');

      if (name && detailUrl) {
        results.push({
          name,
          image: image || null,
          detailUrl: detailUrl.startsWith('http') ? detailUrl : this.baseUrl + '/' + detailUrl,
          id: detailUrl.match(/-(\d+)\.php/)?.[1]
        });
      }
    });

    let detail = null;
    if (results.length > 0) {
      const detailHtml = await cloudscraper.get({ url: results[0].detailUrl, headers: this.headers });
      const $$ = cheerio.load(detailHtml);
      
      const name = $$('.specs-phone-name-title').text().trim();
      const image = $$('.specs-photo-main a img').attr('src');
      
      const specs = [];
      $$('table').each((i, table) => {
        const title = $$(table).find('th').first().text().trim();
        if (title) {
          const items = [];
          $$(table).find('tr').each((j, row) => {
            const label = $$(row).find('td.ttl').text().trim();
            const value = $$(row).find('td.nfo').text().trim().replace(/\s+/g, ' ');
            if (label && value) {
              items.push({ label, value });
            }
          });
          if (items.length > 0) {
            specs.push({ category: title, items });
          }
        }
      });

      const quickSpecs = [];
      $$('.specs-spotlight-features li').each((i, el) => {
        const text = $$(el).text().trim().replace(/\s+/g, ' ');
        if (text) quickSpecs.push(text);
      });

      const prices = [];
      $$('.pricing tbody tr').each((i, el) => {
        const variant = $$(el).find('td').first().text().trim();
        const priceLinks = [];
        $$(el).find('a').each((j, link) => {
          priceLinks.push({
            price: $$(link).text().trim(),
            url: $$(link).attr('href')
          });
        });
        if (variant && priceLinks.length) {
          prices.push({ variant, prices: priceLinks });
        }
      });

      detail = {
        name,
        image: image ? 'https:' + image : null,
        url: results[0].detailUrl,
        quickSpecs,
        specs,
        prices
      };
    }

    return {
      search: results,
      detail
    };
  }
}

(async () => {
  const scraper = new GSMSArena();
  const result = await scraper.get('redmi a3');
  console.log(JSON.stringify(result, null, 2));
})();
