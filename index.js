const express = require('express');
const { resolve } = require('path');
const fs = require('fs');
const path = require('path');
const loadStores = require("./storeloader.js")
const card = require("./cardgen.js");
const { products } = require('./stores/teststore.js');
const e = require('express');
const app = express();
const port = 3010;
const markets = loadStores();
const flavormap = {}
const appname = "Monster Finder"
const addtopageend = ``
app.use(express.static('static'));
function mergeStores(stores) {
  const grouped = {};

  stores.forEach(async store => {
    sp = await store.products();
    sp.forEach(item => {
      const product = {
        ...item,
        storeName: store.name,
        storeLogo: store.storeLogo,
        storeCurrency: store.currency,
        storeCountry: store.country,
      };

      // create array if doesn't exist
      if (!grouped[item.flavor]) {
        grouped[item.flavor] = [];
      }

      grouped[item.flavor].push(product);
    });
  });

  // sort each flavor by price
  Object.keys(grouped).forEach(flavor => {
    grouped[flavor].sort((a, b) => a.price - b.price);
  });

  return grouped;
}

app.get('/', async (req, res) => {
  console.log(req.query.country, req.query.flavor)
  if (!req.query.country && !req.query.flavor && !req.query.q) {
    const templatePath = path.join(__dirname, 'pages', 'index.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    let markethtml = ""
    let allitems = mergeStores(markets);
    const countries = (await Promise.all(markets.map(s => s.country)))
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .map(countryi => `<option value='${countryi}'>${countryi.charAt(0).toUpperCase() + countryi.slice(1)}</option>`)
      .join('');
    // console.log(allitems)
    const flavorfilters = (await Promise.all(markets.map(s => s.getAllFlavors())))
      .flat()                             // merge all flavor arrays
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .map(flavor => `<option value='${flavor}'>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
      .join('');


    for (const flavor in allitems) {
      markethtml += card.productMultiStore(allitems[flavor], allitems[flavor].storeCurrency);
    }
    html = html.replaceAll("{{appName}}", appname);
    html = html.replaceAll("{{results}}", markethtml);
    html = html.replaceAll("{{query}}", "");
    html = html.replaceAll("{{countrylist}}", countries);
    html = html.replaceAll("{{flavorfilters}}", flavorfilters);
    html += addtopageend;
    res.send(html);
  }
  else {
    const selectedcountry = req.query.country;
    const selectedflavor = req.query.flavor;
    const search = req.query.q;
    const flavorfilters = (await Promise.all(markets.map(s => s.getAllFlavors())))
      .flat()                             // merge all flavor arrays
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .map(flavor => `<option value='${flavor}' ${selectedflavor == flavor ? "selected" : ""}>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
      .join('');

    const templatePath = path.join(__dirname, 'pages', 'index.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    let markethtml = ""
    let allitems = mergeStores(markets);
    const countries = (await Promise.all(markets.map(s => s.country)))
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .map(countryi => `<option value='${countryi}' ${selectedcountry == countryi ? "selected" : ""}>${countryi.charAt(0).toUpperCase() + countryi.slice(1)}</option>`)
      .join('');

    for (const flavor in allitems) {
      if (
        !search || 
        allitems[flavor][0].name.toLowerCase().includes(search.toLowerCase())
      ) {
        if (allitems[flavor].some(item => item.storeCountry == selectedcountry) && (selectedcountry !== "" || selectedcountry)) {
          if (flavor !== "" || flavor) {
            console.log(allitems[flavor].some(item => item.storeCountry == selectedcountry), flavor == selectedflavor, selectedflavor == undefined, selectedflavor == "")
            if (flavor == selectedflavor || selectedflavor == undefined || selectedflavor == "") {
              markethtml += card.productMultiStore(allitems[flavor].filter((item) => item.storeCountry == selectedcountry));
            }
          } else {
            markethtml += card.productMultiStore(allitems[flavor].filter((item) => item.storeCountry == selectedcountry));
          }
        }
        else if (selectedcountry == "" || !selectedcountry) {
          console.log("here whe go")
          if (flavor !== "" || flavor) {
            if (flavor == selectedflavor || selectedflavor == undefined || selectedflavor == "") {
              markethtml += card.productMultiStore(allitems[flavor]);
            }
          } else {
            markethtml += card.productMultiStore(allitems[flavor]);
          }
        }
      }

    }
    html = html.replaceAll("{{appName}}", appname);
    html = html.replaceAll("{{results}}", markethtml);
    html = html.replaceAll("{{flavorfilters}}", flavorfilters);
    html = html.replaceAll("{{countrylist}}", countries);
    html = html.replaceAll("{{query}}", search);
    html += addtopageend;
    res.send(html);
  }
});

app.get('/by-flavor/:flavor', async (req, res) => {
  const selectedflavor = req.params.flavor;
  const templatePath = path.join(__dirname, 'pages', 'index.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  let markethtml = ""
  let allitems = mergeStores(markets);
  // console.log(allitems)
  const flavorfilters = (await Promise.all(markets.map(s => s.getAllFlavors())))
    .flat()                             // merge all flavor arrays
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .map(flavor => `<option value='${flavor}' ${selectedflavor == flavor ? "selected" : ""}>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
    .join('');


  for (const flavor in allitems) {
    if (flavor == selectedflavor) {
      markethtml += card.productMultiStore(allitems[flavor], allitems[flavor].storeCurrency);
    }
  }
  html = html.replaceAll("{{appName}}", appname);
  html = html.replaceAll("{{results}}", markethtml);
  html = html.replaceAll("{{flavorfilters}}", flavorfilters);
  html += addtopageend;
  res.send(html);
});
app.get("/about", async (req, res) => {
  const templatePath = path.join(__dirname, 'pages', 'about.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replaceAll("{{appName}}", appname);
  html += addtopageend;
  res.send(html);
})
app.get('/markets', async (req, res) => {
  const templatePath = path.join(__dirname, 'pages', 'marketlist.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  let markethtml = ""
  const countries = (await Promise.all(markets.map(s => s.country)))
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .map(country => `<option value='${country}'>${country.charAt(0).toUpperCase() + country.slice(1)}</option>`)
    .join('');

  for (const market of markets) {
    markethtml += card.storecard(market);
  }

  html = html.replaceAll("{{appName}}", appname);
  html = html.replace("{{countrylist}}", countries)
  html = html.replaceAll("{{marketCards}}", markethtml);
  html += addtopageend;
  res.send(html);
});
app.get('/markets/by-country/:country', async (req, res) => {
  country = req.params.country;
  const templatePath = path.join(__dirname, 'pages', 'marketlist.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  let markethtml = ""
  const countries = (await Promise.all(markets.map(s => s.country)))
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .map(countryi => `<option value='${countryi}' ${country == countryi ? "selected" : ""}>${countryi.charAt(0).toUpperCase() + countryi.slice(1)}</option>`)
    .join('');

  for (const market of markets) {
    if (market.country.toUpperCase() == country.toUpperCase()) {
      markethtml += card.storecard(market);
    }
  }

  html = html.replaceAll("{{appName}}", appname);
  html = html.replace("{{countrylist}}", countries)
  html = html.replaceAll("{{marketCards}}", markethtml);
  html += addtopageend;
  res.send(html);
});
app.get('/market/:id', async (req, res) => {
  const { id } = req.params;
  console.log("ID", id)
  const market = markets.find(m => m.id === id);
  console.log("Market Details: ", market)
  const templatePath = path.join(__dirname, 'pages', 'marketTemplate.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replaceAll('{{appName}}', appname);
  html = html.replaceAll('{{marketName}}', market.name);
  html = html.replaceAll('{{marketLink}}', market.website);
  html = html.replaceAll('{{marketLogo}}', market.storeLogo);
  html = html.replaceAll('{{marketCurrency}}', market.currency);
  productcards = ""
  for (const p of await market.products()) {
    productcards += card.productStoreSpecific(p, market.currency, market.id)
  }
  html = html.replace('{{productFlavorCards}}', productcards);
  html += addtopageend;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
