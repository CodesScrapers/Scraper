const axios = require('axios');
const FormData = require('form-data');

class DeepChat {
  constructor() {
    this.baseUrl = 'https://chat-deep.ai';
    this.ajaxUrl = 'https://chat-deep.ai/wp-admin/admin-ajax.php';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/deepseek-chat/',
      'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };
    this.conversationId = null;
    this.nonce = '7df78b0165';
  }

  async sendMessage(message) {
    const formData = new FormData();
    formData.append('action', 'deepseek_chat');
    formData.append('message', message);
    formData.append('model', 'default');
    formData.append('nonce', this.nonce);
    formData.append('save_conversation', '0');
    formData.append('session_only', '1');
    
    if (this.conversationId) {
      formData.append('conversation_id', this.conversationId);
    }

    const response = await axios.post(this.ajaxUrl, formData, {
      headers: {
        ...this.headers,
        ...formData.getHeaders()
      }
    });

    if (response.data?.success && response.data.data?.conversation_id) {
      this.conversationId = response.data.data.conversation_id;
    }

    return response.data?.data?.response || 'deepai tidak menanggapi';
  }
}

(async () => {
  const scraper = new DeepChat();
  const response = await scraper.sendMessage('apa yang terjadi ketika mulyono masuk lubang selokan?');
  console.log(response);
})();

