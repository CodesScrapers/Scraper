const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class RaphaelScraper {
  constructor() {
    this.baseUrl = "https://raphael.app";
  }

  getHeaders(extra = {}) {
    return {
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "origin": "https://raphael.app",
      "referer": "https://raphael.app/",
      "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      ...extra
    };
  }

  fileToBase64(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
    const mime = mimeMap[ext] || "image/jpeg";
    const data = fs.readFileSync(filePath);
    return `data:${mime};base64,${data.toString("base64")}`;
  }

  async waitForImage(imageUrl, waitMs = 30000, interval = 3000) {
    const deadline = Date.now() + waitMs;
    while (Date.now() < deadline) {
      try {
        const res = await axios.head(imageUrl, {
          timeout: 10000,
          validateStatus: (s) => s < 500
        });
        if (res.status === 200) return true;
      } catch {}
      await new Promise((r) => setTimeout(r, interval));
    }
    return false;
  }

  async generateImage(prompt, options = {}) {
    const payload = {
      prompt,
      entry_type: "text",
      aspect: options.aspect || "auto",
      isSafeContent: true,
      autoTranslate: true,
      model_id: options.model_id || "raphael-pro",
      number_of_images: options.number_of_images || 1,
      highQuality: options.highQuality || false,
      fastMode: options.fastMode || false,
      client_request_id: crypto.randomUUID()
    };

    if (options.imagePath) {
      const base64 = this.fileToBase64(options.imagePath);
      payload.input_image = base64;
      payload.input_image_list = [base64];
      payload.action = "img2img";
      payload.entry_type = "ai-image";
    }

    const res = await axios.post(`${this.baseUrl}/api/generate-image`, payload, {
      timeout: 60000,
      headers: this.getHeaders({ "content-type": "application/json" })
    });
    const imageUrl = `${this.baseUrl}${res.data.url}`;
    const ready = await this.waitForImage(imageUrl);

    return {
      url: imageUrl,
      seed: res.data.seed,
      width: res.data.width,
      height: res.data.height,
      isHighQuality: res.data.isHighQuality
    };
  }
}

(async () => {
  const raphael = new RaphaelScraper();
  const result = await raphael.generateImage("ubah rambutnya menjadi botak", {
    imagePath: "bahlil.jpeg"
  });
  console.log(result);
})();
