const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fs = require('fs');

class Top4topUploader {
  constructor() {
    this.baseUrl = 'https://top4top.io';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/'
    };
  }

  async uploadFile(filePath) {
    const form = new FormData();
    form.append('file_1_', fs.createReadStream(filePath));
    form.append('submitr', '[ رفع الملفات ]');

    const response = await axios.post(`${this.baseUrl}/index.php`, form, {
      headers: {
        ...this.headers,
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const $ = cheerio.load(response.data);
    const result = [];

    $('.alert-warning').each((i, el) => {
      const html = $(el).html();
      
      const thumbnailMatch = html.match(/<img src="([^"]+)"[^>]*class="thumb_img_tag"[^>]*>/);
      const deleteMatch = html.match(/value="(https:\/\/top4top\.io\/del[^"]+)"/);
      
      const links = [];
      
      $('input.all_boxes').each((j, input) => {
        const value = $(input).val();
        if (value.includes('[url=') && value.includes('[img]')) {
          links.push({ type: 'forum_bbcode', url: value });
        } else if (value.includes('[url=')) {
          links.push({ type: 'forum_link', url: value });
        } else if (value.match(/https:\/\/[a-z]\.top4top\.io\/p_\w+\.\w+/)) {
          links.push({ type: 'direct_image', url: value });
        } else if (value.match(/https:\/\/[a-z]\.top4top\.io\/s_\w+\.\w+/)) {
          links.push({ type: 'thumbnail', url: value });
        } else if (value.includes('/del')) {
          links.push({ type: 'delete', url: value });
        } else {
          links.push({ type: 'other', url: value });
        }
      });

      result.push({
        thumbnail: thumbnailMatch ? thumbnailMatch[1] : null,
        deleteUrl: deleteMatch ? deleteMatch[1] : null,
        links: links
      });
    });

    return {
      success: result.length > 0,
      files: result
    };
  }
}

(async () => {
  const uploader = new Top4topUploader();
  const result = await uploader.uploadFile('images.png');
  console.log(JSON.stringify(result, null, 2));
})();

