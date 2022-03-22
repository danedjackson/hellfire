var fs = require('fs');
const path = require('path');
const pricePath = path.resolve(__dirname, "../json/dino-prices.json");

const getDinoPrices = async () => {
    return JSON.parse(fs.readFileSync(pricePath, `utf-8`));
}

module.exports = { getDinoPrices }