const axios = require('axios');

class MlbbStalk {
    constructor() {
        this.baseUrl = 'https://bonipedia.my.id';
        this.headers = {
            'Accept': '*/*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/json',
            'Origin': this.baseUrl,
            'Referer': this.baseUrl + '/',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
        };
    }

    async cekNickname(userId, zoneId) {
        const payload = {
            userId: userId,
            zoneId: zoneId,
            action: 'nickname',
            quick: true
        };

        const response = await axios.post(
            `${this.baseUrl}/cek_api.php`,
            payload,
            { headers: this.headers }
        );

        return response.data;
    }

    async cekBind(userId, zoneId) {
        const payload = {
            userId: userId,
            zoneId: zoneId,
            action: 'cekbind',
            quick: false
        };

        const response = await axios.post(
            `${this.baseUrl}/cek_api.php`,
            payload,
            { headers: this.headers }
        );

        return response.data;
    }

    async cekProfil(userId, zoneId) {
        const payload = {
            userId: userId,
            zoneId: zoneId,
            action: 'search',
            quick: false
        };

        const response = await axios.post(
            `${this.baseUrl}/cek_api.php`,
            payload,
            { headers: this.headers }
        );

        return response.data;
    }

    async cekSemua(userId, zoneId) {
        const [nickname, bind, profil] = await Promise.all([
            this.cekNickname(userId, zoneId),
            this.cekBind(userId, zoneId),
            this.cekProfil(userId, zoneId)
        ]);

        return {
            userId,
            zoneId,
            nickname,
            bind,
            profil
        };
    }
}

(async () => {
    const scraper = new MlbbStalk();
    const result = await scraper.cekSemua('12345678', '1234');
    console.log(JSON.stringify(result, null, 2));
})();
