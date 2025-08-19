module.exports = {
  name: "Budget Store",
  website: "https://example.com",
  storeLogo: "/logos/monsterlogo.png",
  currency: "NZ$",
  country: "Zew Nealand",

  products: [
    { id: 101, name: "Monster Original", price: 2.50, ticketPrice: 2.50, url: "https://example.com/original", flavor: "original", inStock: true, isSale: false, salePrice: null },
    { id: 102, name: "Monster Ultra", price: 2.40, ticketPrice: 2.80, url: "https://example.com/ultra", flavor: "ultra", inStock: true, isSale: true, salePrice: 2.40 },
    { id: 103, name: "Monster Mango Loco", price: 3.00, ticketPrice: 3.00, url: "https://example.com/mangoloco", flavor: "mangoloco", inStock: false, isSale: false, salePrice: null },
    { id: 104, name: "Monster Ultra Violet", price: 2.90, ticketPrice: 3.20, url: "https://example.com/ultraviolet", flavor: "ultraviolet", inStock: true, isSale: true, salePrice: 2.90 },
    { id: 105, name: "Monster Original No Sugar", price: 2.70, ticketPrice: 2.70, url: "https://example.com/original-nosugar", flavor: "original-nosugar", inStock: true, isSale: false, salePrice: null },
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
