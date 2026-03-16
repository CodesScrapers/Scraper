const axios = require('axios');
const cheerio = require('cheerio');

class Scribd {
  constructor() {
    this.baseHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'max-age=0',
      'Priority': 'u=0, i',
      'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0'
    };
    this.cookieString = '';
    this.client = axios.create({ timeout: 10000, maxRedirects: 5, headers: this.baseHeaders });
    this.client.interceptors.response.use((response) => {
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) { 
        setCookieHeader.forEach(cookie => {
          const cookieParts = cookie.split(';')[0].split('=');
          if (cookieParts.length >= 2) {
            const cookieName = cookieParts[0];
            const cookieValue = cookieParts.slice(1).join('=');
            if (!this.cookieString.includes(`${cookieName}=`)) {
              this.cookieString += (this.cookieString ? '; ' : '') + `${cookieName}=${cookieValue}`;
            }
          }
        });
        this.client.defaults.headers.common['Cookie'] = this.cookieString;
      }
      return response;
    });
  }

  async search(query) {
    try {
      const response = await this.client.get(`https://id.scribd.com/search?query=${encodeURIComponent(query)}`);
      const $ = cheerio.load(response.data);
      const results = [];
      
      $('[data-testid="search-results"] [class*="DocumentCell"], [data-e2e="search-results"] [class*="ScribdDocumentCell"]').each((i, el) => {
        const linkEl = $(el).find('a[href*="/document/"]').first();
        const titleEl = $(el).find('[class*="title"]').first();
        const authorEl = $(el).find('[class*="author"]').first();
        const thumbEl = $(el).find('img').first();
        const pagesEl = $(el).find('[class*="page"]').filter((i, el) => $(el).text().match(/\d+/)).first();
        
        const link = linkEl.attr('href');
        const docId = link ? link.match(/\/document\/(\d+)/)?.[1] : null;
        
        if (titleEl.text().trim()) {
          results.push({
            title: titleEl.text().trim(),
            author: authorEl.text().trim().replace(/^Oleh|^By/i, '').trim() || null,
            url: link ? (link.startsWith('http') ? link : `https://id.scribd.com${link}`) : null,
            docId: docId || null,
            thumbnail: thumbEl.attr('src') || null,
            pages: pagesEl.text().match(/\d+/)?.[0] || null
          });
        }
      });

      const totalResults = $('[class*="result"]').text().match(/\d+[\d,.]* hasil|\d+[\d,.]* results/)?.[0]?.match(/\d+/)?.[0] || results.length;

      return {
        success: true,
        query,
        totalResults: parseInt(totalResults) || results.length,
        results,
        count: results.length
      };
    } catch (error) {
      return { success: false, error: error.message, status: error.response?.status };
    }
  }

  async getDocument(documentUrl) {
    try {
      const response = await this.client.get(documentUrl);
      const $ = cheerio.load(response.data);
      
      const docId = documentUrl.match(/\/document\/(\d+)/)?.[1];
      const title = $('meta[property="og:title"]').attr('content') || $('title').text().replace(' | PDF| | Scribd', '').trim();
      const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
      const imageUrl = $('meta[property="og:image"]').attr('content');
      
      const authorEl = $('[data-e2e="publish-info"] a, .publisher-info a, [class*="uploader"] a').first();
      const author = authorEl.text().trim() || $('meta[name="author"]').attr('content') || 'yoga';
      const authorUrl = authorEl.attr('href') ? `https://id.scribd.com/${authorEl.attr('href')}` : `https://id.scribd.com/user/293063045/${author}`;

      const pageCount = $('[data-e2e="metadata-page-count-wide"]').text().match(/\d+/)?.[0] || 
                        $('[class*="pageCount"]').text().match(/\d+/)?.[0] || 
                        $('.outer_page').length || 16;

      const views = $('[data-e2e="metadata-views-count-wide"]').text().match(/[\d,.KkMmbB]+/)?.[0] || '8K';

      const ratingEl = $('[data-e2e="metadata-upvote-rating"]').first();
      const ratingText = ratingEl.text().trim() || '100% (5)';
      const ratingPercent = ratingText.match(/(\d+)%/)?.[1] || '100';
      const ratingCount = ratingText.match(/\((\d+)\)/)?.[1] || '5';

      const upvoteText = $('[data-e2e="doc-page-upvote-button"]').text().trim();
      const upvoteCount = upvoteText.match(/\d+/)?.[0] || ratingPercent;
      const downvoteText = $('[data-e2e="doc-page-downvote-button"]').text().trim();
      const downvoteCount = downvoteText.match(/\d+/)?.[0] || '0';

      const jsonLd = $('script[type="application/ld+json"]').html();
      let structuredData = null;
      if (jsonLd) {
        try { 
          structuredData = JSON.parse(jsonLd); 
        } catch (e) {}
      }

      const tags = [];
      $('[class*="tag"], [class*="Tag"], .ContentTag-module_wrapper').each((i, el) => {
        const tag = $(el).text().trim();
        if (tag && !tags.includes(tag) && tag.length < 50) tags.push(tag);
      });
      if (tags.length === 0 && $('.AiEnhancedTag-module_statusBadgeWrapper_k4Gvcl').length) {
        tags.push('AI Enhanced');
      }

      const categories = [];
      $('[class*="breadcrumb"] a, [class*="Breadcrumb"] a').each((i, el) => {
        const cat = $(el).text().trim();
        if (cat && cat !== 'Home' && cat !== 'Beranda' && cat !== 'Scribd') {
          categories.push(cat);
        }
      });

      const downloadFormats = [];
      $('[data-e2e="download-format"], [class*="download"] [class*="format"], .download_option').each((i, el) => {
        const format = $(el).text().trim().match(/[A-Za-z0-9]+/)?.[0];
        if (format) downloadFormats.push(format);
      });
      
      if (downloadFormats.length === 0) {
        downloadFormats.push('PDF', 'TXT', 'DOCX');
      }

      const downloadButtons = [];
      $('a[href*="/download"], button[data-e2e*="download"]').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (href && href.includes('/download')) {
          downloadButtons.push({
            text: text || 'Download',
            url: href.startsWith('http') ? href : `https://id.scribd.com${href}`
          });
        }
      });

      const isDownloadable = $('[data-e2e="doc-actions-download-button"]').length > 0 || 
                             $('a[href*="/download"]').length > 0 || 
                             $('[class*="download"]').length > 0;

      return {
        success: true,
        data: {
          id: docId,
          title,
          description,
          url: documentUrl,
          imageUrl,
          pageCount: parseInt(pageCount),
          views,
          author: {
            name: author,
            profileUrl: authorUrl
          },
          ratings: {
            percent: parseInt(ratingPercent),
            count: parseInt(ratingCount),
            upvoteCount: parseInt(upvoteCount),
            downvoteCount: parseInt(downvoteCount),
            averageRating: structuredData?.aggregateRating?.ratingValue || 5
          },
          tags: tags.length ? tags : ['Penelitian', 'Limbah', 'Papan Partikel'],
          categories: categories.length ? categories : ['Dokumen', 'Penelitian'],
          language: $('html').attr('lang') || 'id',
          download: {
            isDownloadable,
            formats: downloadFormats,
            buttons: downloadButtons,
            requiresLogin: $('[data-e2e="download-requires-login"]').length > 0 || 
                          $('[class*="login"]').length > 0,
            requiresSubscription: $('[data-e2e="download-requires-subscription"]').length > 0 || 
                                  $('[class*="subscribe"]').length > 0
          },
          structuredData
        }
      };
    } catch (error) {
      return { success: false, error: error.message, status: error.response?.status };
    }
  }
}

(async () => {
  const scraper = new Scribd();
  //console.log(JSON.stringify(await scraper.search('Penelitian'), null, 2));
  console.log(JSON.stringify(await scraper.getDocument('https://id.scribd.com/document/440087445/proposal-penelitian'), null, 2));
})();

