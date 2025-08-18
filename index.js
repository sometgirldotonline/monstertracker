const express = require('express');
const livereload = require("livereload");
const { resolve } = require('path');
const fs = require('fs');
const path = require('path');
const loadStores = require("./storeloader.js")
const card = require("./cardgen.js");
const { products } = require('./stores/teststore.js');
const app = express();
const port = 3010;
const markets = loadStores();
const flavormap = {}
const appname = "Monster Finder"
const addtopageend = `<script src="http://localhost:35729/livereload.js?snipver=1"></script>`
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'static'));
liveReloadServer.watch(path.join(__dirname, 'pages'));
app.use(express.static('static'));
const connectLivereload = require("connect-livereload");
app.use(connectLivereload());
function mergeStores(stores) {
  const grouped = {};

  stores.forEach(store => {
    store.products.forEach(item => {
      const product = {
        ...item,
        storeName: store.name,
        storeLogo: store.storeLogo
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

app.get('/', async (req, res) =>{
  const templatePath = path.join(__dirname, 'pages', 'index.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  let markethtml = ""
  let allitems = mergeStores(markets);
  // console.log(allitems)
  const flavorfilters = (await Promise.all(markets.map(s => s.getAllFlavors())))
    .flat()                             // merge all flavor arrays
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .map(flavor => `<option value='${flavor}'>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
    .join('');

  
  for(const flavor in allitems){
    markethtml += card.productMultiStore(allitems[flavor], "AU$");
  }
  html = html.replaceAll("{{appName}}", appname);
  html = html.replaceAll("{{results}}", markethtml);
  html = html.replaceAll("{{flavorfilters}}", flavorfilters);
  html += addtopageend;
  res.send(html);
});
app.get('/markets/', async (req, res) =>{
  const templatePath = path.join(__dirname, 'pages', 'marketlist.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  let markethtml = ""
  for(const market of markets){
    markethtml += card.storecard(market);
  }

  html = html.replaceAll("{{appName}}", appname);
  html = html.replaceAll("{{marketCards}}", markethtml);
  html += addtopageend;
  res.send(html);
});
app.get('/markets/:id', async (req, res) =>{
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
  for(const p of market.products){
    productcards += card.productStoreSpecific(p, "AU$", market.id)
  }
  html = html.replace('{{productFlavorCards}}', productcards);
  html += addtopageend;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
