module.exports = {
    name: "teststore",
    website: "https://example.com",
    storeLogo: "logos/monsterlogo.png",
    currency: "AUD",
    // Search products by name
    async searchProducts(query) {
      // Return array of products: [{ id, name, price, url }, ...]
      return [{
        "id": 69,
        "name": "Monster Ultra Rosa Can",
        "price": 4.20,
        "url": "http://example.com/gay",
        "flavor": "ultrarosa"
      }]
    },
    async getAllFlavors(){
      return ["ultrarosa", "original", "whitemonsterdilldoughs", "mango"]
    },
    // Get detailed info about a specific product
    async getFlavorInfo(flavor) {
      return {
        "id": 69,
        "name": "Monster Ultra Rosa Can",
        "price": 4.20,
        "url": "http://example.com/gay",
        "flavor": "ultrarosa"
      }
    },
  };
  