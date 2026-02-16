const axios = require('axios');
const cheerio = require('cheerio');

class WatZatSong {
    constructor() {
        this.baseUrl = 'https://www.watzatsong.com';
        this.headers = {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'cookie': 'PHPSESSID=glgtt8ooslue8vhuj4kvt2ope5; cf_clearance=QIEifUu3feCWrkgGpjfoXV2imgrGfKYlaSM5gMLfa9E-1771229415-1.2.1.1-RXav1.iDelOCChStvl5aCVvHb1Z658kYik7juW02ZaFegRHolQ.T_ce9pmcOhld4EqlRfQUtTEaHaCSR3MK34LMDn31tNvtn.eGhfDQiVnnDtKSqMt_LlK_4GLrd2srj.Hx35brckgKKy6o1w6PIXPSjP6bNN6ffnoFS1A8OCZYZ2GLph9fLD1G7bi3vaCDccqZL6HznLqXEG3jXZRzu_bc4ctcAGNlcIVCmc_kYeNM'
        };
    }

    async search(query = '') {
        const response = await axios.get(`${this.baseUrl}/en`, {
            headers: this.headers
        });

        const $ = cheerio.load(response.data);

        return {
            query: query,
            message: 'Search menggunakan Google CSE internal website',
            suggestion: 'Website menggunakan Google Custom Search, hasil pencarian dimuat secara dinamis'
        };
    }

    async getGenrePage(genre = 'other', page = 1) {
        let url = `${this.baseUrl}/en/${genre}`;
        if (page > 1) {
            url += `/last/${page}`;
        }

        const response = await axios.get(url, {
            headers: this.headers
        });

        const $ = cheerio.load(response.data);
        const samples = [];

        $('.sample-box').each((i, el) => {
            const $el = $(el);
            const id = $el.find('.sample-box-actions-play').attr('sample_id') ||
                $el.find('a[href*="/name-that-tune/"]').attr('href')?.split('/').pop()?.replace('.html', '') || '';
            const title = $el.find('.sample-box-comment a').attr('title') || '';
            const userName = $el.find('.sample-box-by-line .user').text() ||
                $el.find('.sample-box-profile-pict').attr('alt')?.replace('WatZatSong user', '').trim() || '';
            const genreText = $el.find('.sample-box-genre').text().trim();
            const audioUrl = $el.find('.sample-box-actions-play').attr('sample') || '';
            const listenText = $el.find('.sample-box-actions__counter').first().text();
            const listenCount = parseInt(listenText.replace(/[()]/g, '')) || 0;
            const commentCount = parseInt($el.find('.sample-box-actions-comments').text()) || 0;
            const answerCount = parseInt(
                $el.find('.sample-box-actions-answer .sample-box-actions__counter')
                    .text()
                    .replace(/[()]/g, '')
            ) || 0;
            const followers = parseInt($el.find('.nb-followers').text()) || 0;
            const isPremium = $el.hasClass('sample-box--premium');
            const postedAgo = $el.find('.sample-box__posted-ago').text().trim() ||
                $el.find('.italic').last().text().trim();

            samples.push({
                id,
                title,
                url: id ? `${this.baseUrl}/en/name-that-tune/${id}.html` : '',
                user: userName,
                genre: genreText,
                audio_url: audioUrl,
                listen_count: listenCount,
                comments: commentCount,
                answer_count: answerCount,
                followers: followers,
                is_premium: isPremium,
                posted_ago: postedAgo
            });
        });

        const pagination = [];
        $('#page-numbers a, #page-numbers .selected').each((i, el) => {
            const $el = $(el);
            const pageNum = $el.text().trim();

            if (pageNum && !isNaN(parseInt(pageNum))) {
                pagination.push({
                    page: pageNum,
                    url: $el.attr('href') ? `${this.baseUrl}${$el.attr('href')}` : null,
                    is_current: $el.hasClass('selected')
                });
            }
        });

        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content');

        return {
            genre,
            current_page: page,
            title: title || `WatZatSong - ${genre} samples`,
            description: description || '',
            total_samples: samples.length,
            samples,
            pagination,
            has_next: samples.length > 0 && page < (
                pagination.length
                    ? parseInt(pagination[pagination.length - 1]?.page)
                    : page
            )
        };
    }

    async getSampleDetail(sampleId) {
        const response = await axios.get(
            `${this.baseUrl}/en/name-that-tune/${sampleId}.html`,
            { headers: this.headers }
        );

        const $ = cheerio.load(response.data);

        const sampleElement = $('.sample-box').first();

        const sample = {
            id: sampleId,
            title: sampleElement.find('.sample-box-comment a').attr('title') || '',
            url: `${this.baseUrl}/en/name-that-tune/${sampleId}.html`,
            user: sampleElement.find('.user').first().text() || '',
            genre: sampleElement.find('.sample-box-genre').text().trim() || '',
            audio_url: sampleElement.find('.sample-box-actions-play').attr('sample') || '',
            listen_count: parseInt(
                sampleElement.find('.sample-box-actions__counter')
                    .first()
                    .text()
                    .replace(/[()]/g, '')
            ) || 0,
            posted_ago: sampleElement.find('.sample-box__posted-ago').text().trim() || ''
        };

        const comments = [];
        $('.comment, .recent-activities-list .row').each((i, el) => {
            const $el = $(el);
            comments.push({
                user: $el.find('.user').text() || '',
                content: $el.find('.content').text().trim() || '',
                time: $el.find('.italic').text().trim() || ''
            });
        });

        return {
            sample,
            comments: comments.slice(0, 10),
            total_comments: comments.length
        };
    }
}

(async () => {
    const scraper = new WatZatSong();
    const search = await scraper.search();
    const otherGenre = await scraper.getGenrePage('other', 1);
    const result = {
        search,
        genre_other: otherGenre
    };

    console.log(JSON.stringify(result, null, 2));
})();
