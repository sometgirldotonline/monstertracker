const fs = require('fs');
const path = require('path');

function loadStores() {
    const modulesDir = path.join(__dirname, 'stores');
    const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
  
    const modules = files.map(file => {
      const mod = require(path.join(modulesDir, file));
      mod.id = path.basename(file, '.js'); // <-- automatically add id
      return mod;
    });
  
    return modules;
  }

module.exports = loadStores;
