const axios = require('axios');
const cheerio = require('cheerio');

class Genius {
  constructor() {
    this.baseUrl = 'https://genius.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': this.baseUrl + '/'
    };
  }

  async getSongDetails(url) {
    const response = await axios.get(url, {
      headers: this.headers
    });

    const $ = cheerio.load(response.data);
    
    const title = $('h1.SongHeader-desktop__Title-sc-908aafe9-9').text().trim();
    const primaryArtist = $('.SongHeader-desktop__CreditList-sc-908aafe9-16 a').first().text().trim();
    
    const album = $('.SongHeader-desktop__AlbumCredit-sc-908aafe9-12 a').first().text().trim();
    const releaseDate = $('.MetadataStats__LabelWithIcon-sc-f0ec0d92-1').first().text().trim();
    const views = $('.MetadataStats__LabelWithIcon-sc-f0ec0d92-1').eq(2).text().trim();
    
    const coverArt = $('.SongHeader-desktop__CoverArt-sc-908aafe9-8 img').attr('src');
    
    const description = [];
    $('.SongDescription__Content-sc-e6b251ea-2 p').each((i, el) => {
      description.push($(el).text().trim());
    });
    
    const lyrics = [];
    $('.Lyrics__Container-sc-d7157b20-1').each((i, el) => {
      const lines = [];
      $(el).contents().each((j, node) => {
        if (node.type === 'text') {
          lines.push($(node).text().trim());
        } else if (node.type === 'tag') {
          if (node.name === 'a') {
            const linkText = $(node).text().trim();
            if (linkText) lines.push(linkText);
          } else if (node.name === 'br') {
            lines.push('\n');
          } else if (node.name === 'i' || node.name === 'b') {
            lines.push($(node).text().trim());
          }
        }
      });
      lyrics.push(lines.join(' ').replace(/\n\s+/g, '\n'));
    });
    
    const credits = [];
    $('.Credit__Container-sc-96426b7f-0').each((i, el) => {
      const label = $(el).find('.Credit__Label-sc-96426b7f-1').text().trim();
      const contributors = [];
      $(el).find('.Credit__Contributor-sc-96426b7f-2 a').each((j, a) => {
        contributors.push($(a).text().trim());
      });
      if (label && contributors.length > 0) {
        credits.push({
          label: label,
          contributors: contributors
        });
      }
    });
    
    const producers = [];
    $('.SongHeader-desktop__TwoColumnArtistContainer-sc-908aafe9-10 .SongHeader-desktop__CreditList-sc-908aafe9-16 a').each((i, el) => {
      producers.push($(el).text().trim());
    });
    
    const writers = [];
    $('.Credit__Container-sc-96426b7f-0').each((i, el) => {
      if ($(el).find('.Credit__Label-sc-96426b7f-1').text().includes('Writers')) {
        $(el).find('a').each((j, a) => {
          writers.push($(a).text().trim());
        });
      }
    });
    
    const tags = [];
    $('.SongTags__Tag-sc-2f4a2b99-3').each((i, el) => {
      tags.push($(el).text().trim());
    });
    
    return {
      title: title,
      artist: primaryArtist,
      album: album,
      releaseDate: releaseDate,
      views: views,
      coverArt: coverArt,
      description: description,
      lyrics: lyrics.join('\n').replace(/\n+/g, '\n'),
      producers: producers,
      writers: writers,
      credits: credits,
      tags: tags,
      url: url
    };
  }
}

(async () => {
  const scraper = new Genius();
  const result = await scraper.getSongDetails('https://genius.com/Eminem-without-me-lyrics');
  console.log(JSON.stringify(result, null, 2));
})();

