const axios = require('axios');
const cheerio = require('cheerio');

class Transfermarkt {
  constructor() {
    this.baseUrl = 'https://www.transfermarkt.co.id';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    };
  }

  async getPlayer(query) {
    const searchUrl = `${this.baseUrl}/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, { headers: this.headers });
    const $ = cheerio.load(data);

    const firstRow = $('#player-grid tbody tr').first();
    const name = firstRow.find('.hauptlink a').first().text().trim();
    const detailUrl = firstRow.find('.hauptlink a').first().attr('href');
    const id = detailUrl?.match(/spieler\/(\d+)/)?.[1];

    const search = {
      name,
      position: firstRow.find('td.zentriert').first().text().trim() || 'N/A',
      age: firstRow.find('td.zentriert').eq(1).text().trim() || 'N/A',
      club: firstRow.find('.tiny_wappen').first().attr('title') || 'N/A',
      nationality: firstRow.find('.flaggenrahmen').first().attr('title') || 'N/A',
      marketValue: firstRow.find('.rechts.hauptlink').first().text().trim() || 'N/A',
      image: firstRow.find('.bilderrahmen-fixed').attr('src') || null,
      detailUrl: detailUrl?.startsWith('http') ? detailUrl : this.baseUrl + detailUrl,
      id
    };

    const detailUrlFull = `${this.baseUrl}/cristiano-ronaldo/profil/spieler/${id}`;
    const detailData = await axios.get(detailUrlFull, { headers: this.headers });
    const $$ = cheerio.load(detailData.data);

    const info = {};
    $$('.info-table .info-table__content').each((i, el) => {
      const text = $$(el).text().trim().replace(/\s+/g, ' ');
      if (i % 2 === 0) {
        info.label = text;
      } else if (info.label) {
        info[info.label] = text;
      }
    });

    const stats = [];
    $$('.responsive-table table tbody tr').each((i, el) => {
      const cols = $$(el).find('td');
      if (cols.length >= 4) {
        const competition = $$(cols[0]).text().trim().replace(/\s+/g, ' ');
        const apps = $$(cols[1]).text().trim();
        const goals = $$(cols[2]).text().trim();
        const assists = $$(cols[3]).text().trim();
        if (competition && competition !== '' && !competition.includes('Total')) {
          stats.push({ competition, apps, goals, assists });
        }
      }
    });

    const marketValueText = $$('.data-header__market-value-wrapper').first().text().trim().replace(/\s+/g, ' ');
    const marketValue = marketValueText.split('Update')[0].trim();

    const detail = {
      id,
      name: $$('h1').first().text().trim().replace(/\s+/g, ' ').replace('#7', '').trim(),
      image: $$('.data-header__profile-image').attr('src') || null,
      club: $$('.data-header__club a').first().text().trim() || 'N/A',
      clubLogo: $$('.data-header__box--big img').first().attr('src') || $$('.data-header__box--big img').first().attr('data-src') || null,
      fullName: info['Nama lengkap:'] || 'N/A',
      age: info['Tanggal lahir / Umur:'] || 'N/A',
      birthplace: info['Tempat kelahiran:']?.replace(/[^\w\s,]/g, '').trim() || 'N/A',
      height: info['Tinggi:'] || 'N/A',
      nationality: info['Kewarganegaraan:']?.replace(/\s+/g, ' ').trim() || 'N/A',
      position: info['Posisi:'] || 'N/A',
      foot: info['Kaki dominan:'] || 'N/A',
      agent: info['Agen pemain:']?.replace(/\s+/g, ' ').trim() || 'N/A',
      joined: info['Bergabung:'] || 'N/A',
      contract: info['Kontrak berakhir:'] || 'N/A',
      marketValue: marketValue || 'N/A',
      stats
    };

    return {
      search,
      detail
    };
  }
}

(async () => {
  const scraper = new Transfermarkt();
  const result = await scraper.getPlayer('Ronaldo');
  console.log(JSON.stringify(result, null, 2));
})();
