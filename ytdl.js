const axios = require('axios');

class YTDL {
    constructor() {
        this.baseUrl = 'https://ytdownloader.io';
        this.nonce = 'cf1ae5b0cc';
        this.headers = {
            'Accept': '*/*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/json',
            'Origin': this.baseUrl,
            'Referer': this.baseUrl + '/',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'x-visolix-nonce': this.nonce
        };
        
        this.validFormats = {
            audio: ['MP3', 'M4A', 'WEBM', 'AAC', 'FLAC', 'OPUS', 'OGG', 'WAV'],
            video: ['MP4 (360p)', 'MP4 (480p)', 'MP4 (720p)', 'MP4 (1080p)', 'MP4 (1440p)', 'WEBM (4K)']
        };
        
        this.formatMap = {
            'MP3': 'mp3',
            'M4A': 'm4a',
            'WEBM': 'webm_audio',
            'AAC': 'aac',
            'FLAC': 'flac',
            'OPUS': 'opus',
            'OGG': 'ogg',
            'WAV': 'wav',
            'MP4 (360p)': '360',
            'MP4 (480p)': '480',
            'MP4 (720p)': '720',
            'MP4 (1080p)': '1080',
            'MP4 (1440p)': '1440',
            'WEBM (4K)': '2160'
        };
    }

    validateFormat(format) {
        const allFormats = [...this.validFormats.audio, ...this.validFormats.video];
        
        if (!allFormats.includes(format)) {
            throw new Error(`Format "${format}" tidak valid. Gunakan format yang benar.`);
        }
    }

    async getVideoInfo(url, format) {
        const payload = {
            url: url,
            format: this.formatMap[format],
            captcha_response: null
        };

        const response = await axios.post(
            `${this.baseUrl}/wp-json/visolix/api/download`,
            payload,
            { headers: this.headers }
        );

        const html = response.data.data;
        const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?]+)/)?.[1];
        const downloadId = html.match(/download-btn-([a-zA-Z0-9]+)/)?.[1];
        const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
            videoId,
            downloadId,
            thumbnail
        };
    }

    async getProgress(downloadId) {
        const payload = {
            id: downloadId
        };

        const response = await axios.post(
            `${this.baseUrl}/wp-json/visolix/api/progress`,
            payload,
            { headers: this.headers }
        );

        return response.data;
    }

    async getSecureUrl(downloadUrl, downloadId) {
        const payload = {
            url: downloadUrl,
            host: 'youtube',
            video_id: downloadId
        };

        const response = await axios.post(
            `${this.baseUrl}/wp-json/visolix/api/youtube-secure-url`,
            payload,
            { headers: this.headers }
        );

        return response.data.secure_url;
    }

    async downloadVideo(url, format) {
        this.validateFormat(format);
        
        const info = await this.getVideoInfo(url, format);
        
        let progress = await this.getProgress(info.downloadId);
        
        while (progress.progress < 1000) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            progress = await this.getProgress(info.downloadId);
        }

        const secureUrl = await this.getSecureUrl(progress.download_url, info.downloadId);
        
        return {
            videoId: info.videoId,
            thumbnail: info.thumbnail,
            format: format,
            downloadUrl: progress.download_url,
            secureUrl: secureUrl
        };
    }
}

(async () => {
    const scraper = new YTDL();
    const result = await scraper.downloadVideo('https://youtu.be/0Raru5sJIPA?si=Cvz48-br2zT8VEnV', 'MP4 (720p)');
    console.log(JSON.stringify(result, null, 2));
})();
