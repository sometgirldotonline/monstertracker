module.exports = {
  name: "Woolworths Australia",
  website: "https://woolworths.com.au",
  storeLogo: "/logos/monsterlogo.png",
  currency: "AU$",
  country: "Australia",

  products: [
    { id: 1, name: "Monster Original", price: 3.50, ticketPrice: 3.50, url: "https://example.com/original", flavor: "original", inStock: true, isSale: false, salePrice: null },
    { id: 2, name: "Monster Ultra", price: 3.20, ticketPrice: 3.80, url: "https://example.com/ultra", flavor: "ultra", inStock: true, isSale: true, salePrice: 3.20 },
    { id: 3, name: "Monster Ultra Violet", price: 4.00, ticketPrice: 4.00, url: "https://example.com/ultraviolet", flavor: "ultraviolet", inStock: false, isSale: false, salePrice: null },
    { id: 4, name: "Monster Mango Loco", price: 3.70, ticketPrice: 4.20, url: "https://example.com/mangoloco", flavor: "mangoloco", inStock: true, isSale: true, salePrice: 3.70 },
    { id: 5, name: "Monster Ultra Fantasy Ruby Red", price: 4.50, ticketPrice: 4.50, url: "https://example.com/ultrafantasyrubyred", flavor: "ultrafantasyrubyred", inStock: false, isSale: false, salePrice: null },
    { id: 6, name: "Monster Ultra Fiesta Mango", price: 4.20, ticketPrice: 4.20, url: "https://example.com/ultrafiestamango", flavor: "ultrafiestamango", inStock: true, isSale: false, salePrice: null },
    { id: 7, name: "Monster Pipeline Punch", price: 3.90, ticketPrice: 4.30, url: "https://example.com/pipelinepunch", flavor: "pipelinepunch", inStock: true, isSale: true, salePrice: 3.90 },
    { id: 8, name: "Monster Aussie Lemonade", price: 4.10, ticketPrice: 4.10, url: "https://example.com/aussielemonade", flavor: "aussielemonade", inStock: false, isSale: false, salePrice: null },
    { id: 9, name: "Monster Ultra Gold", price: 4.00, ticketPrice: 4.00, url: "https://example.com/ultragold", flavor: "ultragold", inStock: true, isSale: false, salePrice: null },
    { id: 10, name: "Monster Ultra Peachy Keen", price: 3.60, ticketPrice: 4.20, url: "https://example.com/ultrapeachy", flavor: "ultrapeachy", inStock: true, isSale: true, salePrice: 3.60 },
    { id: 11, name: "Monster Ultra Strawberry Dreams", price: 4.50, ticketPrice: 4.50, url: "https://example.com/ultrastrawberry", flavor: "ultrastrawberry", inStock: false, isSale: false, salePrice: null },
    { id: 12, name: "Monster Papillon", price: 4.00, ticketPrice: 4.00, url: "https://example.com/papillion", flavor: "papillion", inStock: true, isSale: false, salePrice: null },
    { id: 13, name: "Monster Original (No Sugar)", price: 3.00, ticketPrice: 3.60, url: "https://example.com/original-nosugar", flavor: "original-nosugar", inStock: true, isSale: true, salePrice: 3.00 },
  ],

  async searchProducts(query) {
    return this.products.filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()));
  },

  async getAllFlavors() {
    return this.products.map(p => p.flavor);
  },

  async getFlavorInfo(flavor) {
    return this.products.find(p => p.flavor === flavor) || null;
  },
};
