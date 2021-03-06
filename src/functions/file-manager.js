var fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');
const pricePath = path.resolve(__dirname, "../json/dino-prices.json");

const ftpLocation = process.env.FTPLOCATION;
const ftpPort = process.env.FTPPORT;
const ftpusername = process.env.FTPUSERNAME;
const ftppassword = process.env.FTPPASSWORD;
const server = process.env.SERVER;

var { deductUserAmountBank, getUserAmount } = require('../api/unbelievaboat');

const getDinoPrices = async () => {
    return JSON.parse(fs.readFileSync(pricePath, `utf-8`));
}

async function deleteLocalFile(fileId) {
    console.log("Deleting local files . . .");
    fs.unlink("./" + fileId + ".json", (err) => {
        if (err) console.error(err);
    });
}

const handleDinoGrow = async(message, steamId, price, dinoName) => {
    if (!await downloadPlayerFile(message, steamId)) return false;
    if (!await editPlayerFile(message, steamId, dinoName)) return false;
    if (!await uploadPlayerFile(message, steamId, price)) return false;
    return true;
}

const downloadPlayerFile = async (message, steamId) => {
    var ftpClient = new ftp.Client();
    console.log(`Downloading file for ${steamId}. . .`);
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        console.log(`${server}${steamId}.json`);
        await ftpClient.downloadTo(steamId + ".json", `${server}${steamId}.json`);
        ftpClient.close();
        return true;
    } catch ( err ) {
        console.log(`Error while downloading file: ${err}`);
        ftpClient.close();
        message.reply(`could not find your dino information. You may not have a dinosaur on the server.`);
        return false;
    }
}

const editPlayerFile = async (message, steamId, dinoName) => {
    console.log(`Editing file for ${steamId}. . .`)
    try{
        var contents = JSON.parse(fs.readFileSync(`${steamId}.json`, `utf-8`));
        if(contents.bBrokenLegs) {
            message.reply(`please heal your leg before requesting a grow.`);
            return false;
        }
        if(contents.BleedingRate.localeCompare("0") !== 0) {
            message.reply(`please heal your bleed before requesting a grow.`);
            return false;
        }
        var height;
        dinoName.toLowerCase() == "spino" ? height = 200 : height = 100;
        contents.CharacterClass = dinoName;
        contents.Growth = "1.0";
        contents.Hunger = "9999";
        contents.Thirst = "9999";
        contents.Stamina = "9999";
        contents.Health = "15000";
        
        //Prevent fall through map
        var locationParts;
        locationParts = contents.Location_Isle_V3.split("Z=", 2);
        locationParts[1] = parseFloat(locationParts[1]);
        locationParts[1] += height;
        locationParts[0] += "Z=";
        locationParts[1] = locationParts[1].toString();
        var completed = locationParts[0] + locationParts[1];
        contents.Location_Isle_V3 = completed;

        fs.writeFileSync(`${steamId}.json`, JSON.stringify(contents, null, 4));
        return true;
    } catch ( err ) {
        console.log(`Something went wrong growing dino for ${steamId}: ${err}`);
        message.reply(`something went wrong growing your dino. Please try again.`);
        return false;
    }
}

const uploadPlayerFile = async (message, steamId, price) => {
    var ftpClient = new ftp.Client();
    console.log(`Uploading file ${steamId}. . .`);
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        var status = await ftpClient.uploadFrom(`${steamId}.json`, `${server}${steamId}.json`);
        var retryCount = 0;
        while (status.code != 226 && retryCount < 2) {
            status = await ftpClient.uploadFrom(`${steamId}.json`, `${server}${steamId}.json`);
            retryCount++;
        }
        if (status.code != 226) {
            message.reply(`something went wrong trying to get dino info. . . Try again please.`);
            console.log(`Status code from uploading attempt: ${status.code}`);
            deleteLocalFile(steamId);
            ftpClient.close();
            return false;
        }
        //Attempt to deduct lives
        if(price != undefined && price != null){
            console.log(`Deducting ${price} embers at upload for ${message.author.username}`);
            if(!await deductEmbers(message, price)) return false;
        }
        deleteLocalFile(steamId);
        return true;
    } catch( err ) {
        console.log(`Error occurred trying to upload file: ${err}`);
        message.reply(`something went wrong\nDo you have a dino on the server? Try again please.`);
        ftpClient.close();
        return false;
    }
}

const deductEmbers = async(message, price) => {

    var bankAmount = await getUserAmount(message.guild.id, message.author.id);
    if (!bankAmount) {
        message.reply(`something went wrong checking your balance. Please try again.`);
        return false;
    }
    if((parseInt(bankAmount) - parseInt(price)) < 0) {
        message.reply(`you do not have enough embers for this purchase`);
        return false;
    }

    if (!deductUserAmountBank(message.guild.id, message.author.id, price)) {
        message.reply(`something went wrong deducting embers. Please try again.`);
        return false;
    }
    return true;
}


module.exports = { handleDinoGrow, getDinoPrices }