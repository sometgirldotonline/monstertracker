const axios = require('axios').default;
const client = axios.create({ 
  timeout: 60000, // 15 second timeout
  headers: {
    'Host': 'novafurry.win',
    'User-Agent': 'MonsterTracker/1.0'
  },
});

let fmap = {
    "Ultra": "ultra",
    "Ultra Gold": "ultragold",
    "Ultra Violet": "ultraviolet",
    "Ultra Strawberry": "ultrastrawberry",
    "Pipeline Punch": "pipelinepunch",
    "Mango Loco": "mangoloco",
    "Ultra Ruby Red": "ultrafantasyrubyred",
    "Ultra Peachy Keen": "ultrapeachy",
    "Ultra Fiesta Mango": "ultrafiestamango",
    "Zero Sugar": "original-nosugar",
    "Aussie Lemonade": "aussielemonade",
    "Green": "original",
    "Papillon": "papillion"
}

hasInitialised = false;
module.exports = {
  name: "Coles Australia",
  website: "https://coles.com.au",
  storeLogo: "https://www.coles.com.au/content/dam/coles/global/icons/favicons/apple-touch-icon.png",
  currency: "AU$",
  country: "Australia",

  productsArray: [],
  colesResponse: {},

  async init() {
    console.log("Initialising Coles AU");
    let res1;
    let res2;
    try {
      this.productsArray = [];
      // First request to get cookies
      console.log("Requesting list of monster products.");
      res2 = await client.get(
        "http://192.9.180.96/colesmonstercache.php"
      );

      const json = res2.data;
      console.log(res2.data)
      this.colesResponse = json;
      
      if (!json.results || json.results.length === 0) {
        console.warn("No products returned from Coles API");
        hasInitialised = true;
        return;
      }

      // Parse products
      json.results.filter(item => item.product_size == "500mL").forEach(item => !item.product_name.includes("Super Dry")).forEach(item => {
          flavor = item.product_name.replaceAll(/Energy|Drink|Can/ig, "").trim().replace("Flavour","").replace("flavour", "").trim()
          this.productsArray.push({
              id: item.url.split("/")[4],
              name: item.product_name,
              price: item.current_price,
              ticketPrice: null,
              flavor: fmap[flavor] || flavor.toLowerCase().replace(/\s+/g, "-"),
              inStock: null,
              isSale: null,
              salePrice: null,
              url: item.url

          })
      });
      
      console.log(`✓ Coles AU initialized with ${this.productsArray.length} products`);
      hasInitialised = true;
    } catch (error) {
      console.error("Coles initialization failed:", error.message);
      console.error(error)
      // Set as initialized even if failed to prevent retries
      hasInitialised = true;
      this.productsArray = [];
    }
  },

  async products() {
    if(!hasInitialised) await this.init();
    return this.productsArray;
  },

  async searchProducts(query) {
    const pa = await this.products();
    return pa.filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()));
  },

  async getAllFlavors() {
    const pa = await this.products();
    return pa.map(p => p.flavor);
  },

  async getFlavorInfo(flavor) {
    const pa = await this.products();
    return pa.find(p => p.flavor === flavor) || null;
  },
};