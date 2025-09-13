const express = require('express');
const { resolve } = require('path');
const fs = require('fs');
const path = require('path');
const loadStores = require("./storeloader.js")
const card = require("./cardgen.js");
const e = require('express');
const app = express();
const port = 3010;
const markets = loadStores();
app.disable('etag');
const flavormap = {
    "ultra": "Ultra",
    "ultragold": "Ultra Gold",
    "ultraviolet": "Ultra Violet",
    "ultrastrawberry": "Ultra Strawberry Dreams",
    "pipelinepunch": "Pipeline Punch",
    "mangoloco": "Mango Loco",
    "ultrafantasyrubyred": "Ultra Fantasy Ruby Red",
    "ultrapeachy": "Ultra Peachy Keen",
    "ultrafiestamango": "Ultra Fiesta Mango",
    "original-nosugar": "Original Zero Sugar",
    "aussielemonade": "Aussie Lemonade",
    "original": "Green",
    "papillion": "Papillon"
}
let isCachingNow = false;
const headelements = `
<!-- Primary Meta Tags -->
<title>MonsterTracker - Monster Energy Price Tracker</title>
<meta name="title" content="MonsterTracker - Monster Energy Price Tracker" />
<meta name="description" content="fuckin gay mannnn" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://mt.novafurry.win" />
<meta property="og:title" content="MonsterTracker - Monster Energy Price Tracker" />
<meta property="og:description" content="fuckin gay mannnn" />
<meta property="og:image" content="https://mt.novafurry.win/cover.png" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://mt.novafurry.win" />
<meta property="twitter:title" content="MonsterTracker - Monster Energy Price Tracker" />
<meta property="twitter:description" content="fuckin gay mannnn" />
<meta property="twitter:image" content="https://mt.novafurry.win/cover.png" />
`
const appname = "Monster Tracker"


app.use(express.static('static'));

// Request-scoped cache to prevent multiple initializations
let requestCache = null;
let cacheTimestamp = 0;
let isLoading = false;
const CACHE_DURATION = 30000; // 30 seconds

// Optimized data fetching for serverless
async function getStoreData() {
  // Check if we have fresh cached data
  let count = 0
  if(requestCache) {count = Object.values(requestCache.allItems).filter(
  v => Array.isArray(v) && v.length > 0
).length}
  if (requestCache && count > 2 && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    console.log('Using cached store data', requestCache);
    return requestCache;
  }

  // Check if another request is already loading
  if (isLoading) {
    console.log('Another request is loading, waiting...');
    // Wait up to 10 seconds for the other request to complete
    let attempts = 0;
    while (isLoading && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (requestCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        console.log('Using cache from parallel request');
        return requestCache;
      }
    }
  }

  isLoading = true;
  console.log('Fetching fresh store data...');
  const start = Date.now();
  
  try {
    // Initialize all stores in parallel with timeout handling
    const initResults = await Promise.allSettled(
      markets.map(async market => {
        if (market.init && typeof market.init === 'function') {
          try {
            await market.init();
            return { success: true, store: market.name };
          } catch (error) {
            console.error(`Failed to initialize ${market.name}:`, error.message);
            return { success: false, store: market.name, error: error.message };
          }
        }
        return { success: true, store: market.name };
      })
    );
    
    // Log initialization results
    const successful = initResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = initResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    console.log(`Store initialization: ${successful} successful, ${failed} failed`);
    
    // Get all data in parallel
    const [allItems, flavors, countries] = await Promise.all([
      mergeStores(markets),
      getFlavors(),
      getCountries()
    ]);
    
    console.log(`Store data fetched in ${Date.now() - start}ms`);
    
    // Cache the result
    requestCache = { allItems, flavors, countries };
    cacheTimestamp = Date.now();
    
    return requestCache;
  } finally {
    isLoading = false;
  }
}

async function getFlavors() {
  const flavorArrays = await Promise.allSettled(
    markets.map(async s => {
      try {
        return await s.getAllFlavors();
      } catch (error) {
        console.error(`Failed to get flavors from ${s.name}:`, error.message);
        return [];
      }
    })
  );
  
  return flavorArrays
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i);
}

function getCountries() {
  return markets.map(s => s.country).filter((v, i, a) => a.indexOf(v) === i);
}

async function mergeStores(stores) {
  const grouped = {};

  // Use Promise.allSettled to handle failed stores gracefully
  const storeProducts = await Promise.allSettled(
    stores.map(async store => {
      try {
        const products = await store.products();
        return { store, products };
      } catch (error) {
        console.error(`Failed to get products from ${store.name}:`, error.message);
        return { store, products: [] };
      }
    })
  );

  storeProducts.forEach(result => {
    if (result.status === 'fulfilled') {
      const { store, products } = result.value;
      products.forEach(item => {
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
    }
  });

  // sort each flavor by price
  Object.keys(grouped).forEach(flavor => {
    grouped[flavor].sort((a, b) => a.price - b.price);
  });

  return grouped;
}

// Display a loading screen- this page will have just the toolbar- no navigation, a spinner/indeterminate loading bar, it will make a request to /mainpage on load, when the request completes, it overwrites the webpages html client side with the response
app.get('/', async (req, res) => {
  const templatePath = path.join(__dirname, 'pages', 'loading.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
 res.send(html);
});

app.get('/market/:id', async (req, res) => {
  const templatePath = path.join(__dirname, 'pages', 'loading.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
 res.send(html);
});


app.get('/internal/', async (req, res) => {
  console.log(req.query.country, req.query.flavor);
  
  try {
    const { allItems, flavors, countries } = await getStoreData();
    
    if (!req.query.country && !req.query.flavor && !req.query.q) {
      const templatePath = path.join(__dirname, 'pages', 'index.html');
      let html = fs.readFileSync(templatePath, 'utf8');
      let markethtml = ""
      
      const countryOptions = countries
        .map(countryi => `<option value='${countryi}'>${countryi.charAt(0).toUpperCase() + countryi.slice(1)}</option>`)
        .join('');
      
      const flavorfilters = flavors
        .map(flavor => `<option value='${flavor}'>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
        .join('');

      for (const flavor in allItems) {
        if (allItems[flavor] && allItems[flavor].length > 0) {
          markethtml += card.productMultiStore(allItems[flavor], allItems[flavor][0]?.storeCurrency);
        }
      }
      html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
     html = html.replaceAll("{{results}}", markethtml);
      html = html.replaceAll("{{query}}", "");
      html = html.replaceAll("{{countrylist}}", countryOptions);
      html = html.replaceAll("{{flavorfilters}}", flavorfilters);
        res.send(html);
    }
    else {
      const selectedcountry = req.query.country;
      const selectedflavor = req.query.flavor;
      const search = req.query.q;
      
      const flavorfilters = flavors
        .map(flavor => `<option value='${flavor}' ${selectedflavor == flavor ? "selected" : ""}>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
        .join('');

      const templatePath = path.join(__dirname, 'pages', 'index.html');
      let html = fs.readFileSync(templatePath, 'utf8');
      let markethtml = ""
      
      const countryOptions = countries
        .map(countryi => `<option value='${countryi}' ${selectedcountry == countryi ? "selected" : ""}>${countryi.charAt(0).toUpperCase() + countryi.slice(1)}</option>`)
        .join('');

      for (const flavor in allItems) {
        if (
          !search || 
          (allItems[flavor] && allItems[flavor].length > 0 && allItems[flavor][0].name.toLowerCase().includes(search.toLowerCase()))
        ) {
          if (allItems[flavor].some(item => item.storeCountry == selectedcountry) && (selectedcountry !== "" || selectedcountry)) {
            if (flavor !== "" || flavor) {
              if (flavor == selectedflavor || selectedflavor == undefined || selectedflavor == "") {
                const filteredItems = allItems[flavor].filter((item) => item.storeCountry == selectedcountry);
                if (filteredItems.length > 0) {
                  markethtml += card.productMultiStore(filteredItems);
                }
              }
            } else {
              const filteredItems = allItems[flavor].filter((item) => item.storeCountry == selectedcountry);
              if (filteredItems.length > 0) {
                markethtml += card.productMultiStore(filteredItems);
              }
            }
          }
          else if (selectedcountry == "" || !selectedcountry) {
            console.log("here whe go")
            if (flavor !== "" || flavor) {
              if (flavor == selectedflavor || selectedflavor == undefined || selectedflavor == "") {
                if (allItems[flavor] && allItems[flavor].length > 0) {
                  markethtml += card.productMultiStore(allItems[flavor]);
                }
              }
            } else {
              if (allItems[flavor] && allItems[flavor].length > 0) {
                markethtml += card.productMultiStore(allItems[flavor]);
              }
            }
          }
        }
      }
      html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
     html = html.replaceAll("{{results}}", markethtml);
      html = html.replaceAll("{{flavorfilters}}", flavorfilters);
      html = html.replaceAll("{{countrylist}}", countryOptions);
      html = html.replaceAll("{{query}}", search);
        res.send(html);
    }
  } catch (error) {
    console.error('Error in /internal/ route:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/by-flavor/:flavor', async (req, res) => {
  const selectedflavor = req.params.flavor;
  
  try {
    const { allItems, flavors } = await getStoreData();
    
    const templatePath = path.join(__dirname, 'pages', 'index.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    let markethtml = ""
    
    const flavorfilters = flavors
      .map(flavor => `<option value='${flavor}' ${selectedflavor == flavor ? "selected" : ""}>${flavormap.hasOwnProperty(flavor) ? flavormap[flavor] : flavor.charAt(0).toUpperCase() + flavor.slice(1)}</option>`)
      .join('');

    for (const flavor in allItems) {
      if (flavor == selectedflavor && allItems[flavor] && allItems[flavor].length > 0) {
        markethtml += card.productMultiStore(allItems[flavor], allItems[flavor][0]?.storeCurrency);
      }
    }
    html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
   html = html.replaceAll("{{results}}", markethtml);
    html = html.replaceAll("{{flavorfilters}}", flavorfilters);
    res.send(html);
  } catch (error) {
    console.error('Error in /by-flavor/ route:', error);
    res.status(500).send('Internal server error');
  }
});
app.get("/about", async (req, res) => {
  const templatePath = path.join(__dirname, 'pages', 'about.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
  res.send(html);
})
app.get('/markets', async (req, res) => {
  try {
    const { countries } = await getStoreData();
    
    const templatePath = path.join(__dirname, 'pages', 'marketlist.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    let markethtml = ""
    
    const countryOptions = countries
      .map(country => `<option value='${country}'>${country.charAt(0).toUpperCase() + country.slice(1)}</option>`)
      .join('');

    for (const market of markets) {
      markethtml += card.storecard(market);
    }

    html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
   html = html.replace("{{countrylist}}", countryOptions)
    html = html.replaceAll("{{marketCards}}", markethtml);
    res.send(html);
  } catch (error) {
    console.error('Error in /markets route:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/markets/by-country/:country', async (req, res) => {
  const country = req.params.country;
  
  try {
    const { countries } = await getStoreData();
    
    const templatePath = path.join(__dirname, 'pages', 'marketlist.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    let markethtml = ""
    
    const countryOptions = countries
      .map(countryi => `<option value='${countryi}' ${country == countryi ? "selected" : ""}>${countryi.charAt(0).toUpperCase() + countryi.slice(1)}</option>`)
      .join('');

    for (const market of markets) {
      if (market.country.toUpperCase() == country.toUpperCase()) {
        markethtml += card.storecard(market);
      }
    }

    html = html.replaceAll("{{appName}}", appname);
html = html.replaceAll("<head>","<head>"+headelements);
html = html.replace("{{countrylist}}", countryOptions)
    html = html.replaceAll("{{marketCards}}", markethtml);
    res.send(html);
  } catch (error) {
    console.error('Error in /markets/by-country/ route:', error);
    res.status(500).send('Internal server error');
  }
});
app.get('/internal/market/:id', async (req, res) => {
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
  res.send(html);
});
if(env.RUNNING_IN_WORKER == "YES"){
    export default app;
}
else{
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
}
