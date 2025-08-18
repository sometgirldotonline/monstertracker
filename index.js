const express = require('express');
const { resolve } = require('path');
const fs = require('fs');
const path = require('path');
const loadStores = require("./storeloader.js")
const app = express();
const port = 3010;
const supermarkets = loadStores();
const appname = "Monster Finder"
app.use(express.static('static'));

app.get('/markets/:id', async (req, res) =>{
  const { id } = req.params;
  console.log("ID", id)
  const market = supermarkets.find(m => m.id === id);
  console.log("Market Details: ", market)
  const templatePath = path.join(__dirname, 'pages', 'marketTemplate.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replaceAll('{{appName}}', appname);
  html = html.replaceAll('{{marketName}}', market.name);
  console.log("Oh balls")
  html = html.replaceAll('{{marketLink}}', market.website);
  console.log("Oh balls2")
  html = html.replaceAll('{{marketLogo}}', market.storeLogo);
  console.log("Oh balls3")
  html = html.replaceAll('{{marketCurrency}}', market.currency);
  console.log("Oh balls4")
  res.send(html);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
