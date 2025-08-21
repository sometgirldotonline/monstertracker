const axios = require('axios').default;
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Set reasonable timeouts for Woolworths API
const cookieJar = new tough.CookieJar();
const client = wrapper(axios.create({ 
  jar: cookieJar, 
  withCredentials: true,
  timeout: 60000, // 15 second timeout
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0'
  },
}));

fmap = {
    "Ultra": "ultra",
    "Ultra Gold": "ultragold",
    "Ultra Violet": "ultraviolet",
    "Ultra Strawberry Dreams": "ultrastrawberry",
    "Pipeline Punch": "pipelinepunch",
    "Mango Loco": "mangoloco",
    "Ultra Fantasy Ruby Red": "ultrafantasyrubyred",
    "Ultra Peachy Keen": "ultrapeachy",
    "Ultra Fiesta Mango": "ultrafiestamango",
    "Original Zero Sugar": "original-nosugar",
    "Aussie Lemonade": "aussielemonade",
    "Green": "original",
    "Papillon": "papillion"
}

hasInitialised = false;
module.exports = {
  name: "Woolworths Australia",
  website: "https://woolworths.com.au",
  storeLogo: "https://cdn0.woolworths.media/content/content/icon-header-logo-only.png",
  currency: "AU$",
  country: "Australia",

  productsArray: [],
  woolworthsResponse: {},

  async init() {
    console.log("Initialising Woolworths AU");
    let res1;
    let res2;
    try {
      this.productsArray = [];
      // First request to get cookies
      console.log("Sending cookie request");
      res1 = await client.get("http://www.woolworths.com.au/shop/search/products?searchTerm=Monster%20Energy");

      // Prepare headers for the second request
      const myHeaders = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0"
      };

      const raw = {
        "Filters": [
          { "Key": "Level1Categories", "Items": [{ "Term": "1_5AF3A0A" }] },
          { "Key": "SoldBy", "Items": [{ "Term": "Woolworths" }] },
          { "Key": "Brand", "Items": [{ "Term": "Monster" }, { "Term": "Monster Energy" }] }
        ],
        "IsSpecial": false,
        "Location": "/shop/search/products?searchTerm=Monster%20Energy&pageNumber=1&sortBy=TraderRelevance&filterLevel1Categories(1_5AF3A0A);SoldBy(Woolworths);Brand(Monster,Monster%20Energy)",
        "PageNumber": 1,
        "PageSize": 36,
        "SearchTerm": "Monster Energy",
        "SortType": "TraderRelevance",
        "IsHideUnavailableProducts": false,
        "IsRegisteredRewardCardPromotion": null,
        "ExcludeSearchTypes": ["UntraceableVendors"],
        "GpBoost": 0,
        "GroupEdmVariants": false,
        "EnableAdReRanking": false
      };

      // Second request to get product list
      console.log("Requesting list of monster products.");
      res2 = await client.post(
        "http://www.woolworths.com.au/apis/ui/Search/products",
        raw,
        { headers: myHeaders }
      );

      const json = res2.data;
      this.woolworthsResponse = json;
      
      if (!json.Products || json.Products.length === 0) {
        console.warn("No products returned from Woolworths API");
        hasInitialised = true;
        return;
      }

      // Parse products
      for (let i of json.Products) {
        let desc = i.Products[0].DisplayName;
        if(i.Products[0].Price == null) continue;
        
        // --- Type ---
        let type;
        if (/(\d+)\s*[xX]\s*\d+\s?(?:mL|L)/.test(desc) || /\bx\s*\d+\s*pack/i.test(desc) || /\d+\s*pack/i.test(desc)) {
          type = "Multipack";
          continue;
        } else {
          type = "Can";
        }

        // --- Size ---
        let size;
        if (type === "Multipack") {
          let count = desc.match(/(\d+)\s*pack/i) || desc.match(/x\s*(\d+)/i);
          let volume = desc.match(/(\d+)\s?(mL|L)/i);
          if (count && volume) {
            size = `${count[1]}x${volume[0]} cans`;
          } else {
            size = "Unknown multipack size";
          }
        } else {
          size = desc.match(/\d+\s?(?:mL|L)/i)?.[0] || "Unknown size";
        }

        // --- Clean Description ---
        desc = desc.replace(/\d+\s?(?:mL|L)/gi, "").trim();
        desc = desc.replace(/Multipack|Cans?/gi, "").trim();

        // --- Flavor ---
        let flavor = desc
          .split("<br>")[0]
          .replace(/Monster/gi, "")
          .replace(/Energy/gi, "")
          .replace(/Drink/gi, "")
          .replace(/Can(s)?/gi, "")
          .replace("Flavour", "")
          .replace(/\s+/g, " ")
          .trim();
          
        this.productsArray.push({
          id: i.Products[0].Stockcode,
          name: i.Products[0].DisplayName,
          price: i.Products[0].Price,
          ticketPrice: i.Products[0].WasPrice,
          flavor: fmap[flavor] || flavor.toLowerCase().replace(/\s+/g, "-"),
          inStock: i.Products[0].IsInStock,
          isSale: i.Products[0].Price != i.Products[0].WasPrice,
          salePrice: i.Products[0].Price
        });
      }
      
      console.log(`✓ Woolworths AU initialized with ${this.productsArray.length} products`);
      hasInitialised = true;
    } catch (error) {
      console.error("Woolworths initialization failed:", error.message);
      // console.error(error.response.data)
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