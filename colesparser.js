let colesdata = require("./colestestdata.json");
colesdata.results = colesdata.results.filter(item => !item.product_name.includes("Dry"));
let data = []
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

colesdata.results.filter(item => item.product_size == "500mL").forEach(item => {
    flavor = item.product_name.replaceAll(/Energy|Drink|Can/ig, "").trim().replace("Flavour","").replace("flavour", "").trim()
    data.push({
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
data.forEach(prod=>console.log(prod))