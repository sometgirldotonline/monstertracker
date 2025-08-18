cardgen = {
    productStoreSpecific: function (product, currencySymbol, storeid) {
        return `
    <div class="card rounded-xl p-6 f-${product.flavor} flavor-accent-bg">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold f-${product.flavor} flavor-accent-text">${product.name}</h3>
        </div>
        <div class="space-y-3">
            <img src="/flavorImages/${product.flavor}.webp" alt="Product Image for ${product.name}">
        </div>
        <div class="space-y-3">
            <span class="nowprice">${currencySymbol}${product.price}</span> ${product.isSale ? `<span class="wasprice">${currencySymbol}${product.ticketPrice}</span>` : ""}
        </div>
        <button class="w-full mt-4 btn-primary" onclick="addfavourite('${storeid}', '${product.id}')">Add to Favorites</button>
    </div>
        `
    },
    productMultiStore: function (stores, currencySymbol) {
        function buildItem(obj){
            return `<div class="price-row flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <span class="font-medium">${obj.storeName}</span>
            </div>
            <span class="text-xl font-bold">${currencySymbol}${obj.price}</span>
          </div>`
        }
        product = stores[0] // best guess at data for products?
        sortedProducts = stores.sort((a, b) => a.price - b.price);
        bestPriceProduct = sortedProducts.shift()
        return `
    <div class="card rounded-xl p-6 f-${product.flavor} flavor-accent-bg">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold f-${product.flavor} flavor-accent-text">${product.name}</h3>
        </div>
        <div class="space-y-3 mb-4">
            <img src="/flavorImages/${product.flavor}.webp" alt="Product Image for ${product.name}">
        </div>
        <div class="space-y-3 mb-4">
           <div class="best-price rounded-lg p-3 flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <span class="font-medium">${bestPriceProduct.storeName}</span>
            </div>
            <span class="text-xl font-bold text-green-400">${currencySymbol}${bestPriceProduct.price}</span>
          </div>
          ${
            sortedProducts.map(buildItem).join("")
          }
        </div>
    </div>
        `
    },
    storecard: function (market) {
        return `
    <div class="card market rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">${market.name}</h3>
        </div>
        <div class="space-y-3 mb-4">
            <img src="${market.storeLogo}" alt="Market Logo for ${market.name}">
        </div>
        <div class="space-y-3 mb-4">
           <div class="price-row rounded-lg p-3 flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <span class="font-medium">Country</span>
            </div>
            <span class="text-xl font-bold text-green-400">${market.country}</span>
          </div>
          <div class="price-row flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <span class="font-medium">Currency</span>
            </div>
            <span class="text-xl font-bold">${market.currency}</span>
          </div>
        </div>
        <a role="button" class="w-full mt-4 btn-primary" href="/markets/${market.id}">View Flavors</a>
    </div>
        `
    }
}
module.exports = cardgen;
