var fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');
var growPricePath = path.resolve(__dirname, "../json/grow-prices.json");
var injectPricePath = path.resolve(__dirname, "../json/inject-prices.json");
var generalVars = path.resolve(__dirname, "../json/general.json");

const ftpLocation = process.env.FTPLOCATION;
const ftpPort = process.env.FTPPORT;
const ftpusername = process.env.FTPUSERNAME;
const ftppassword = process.env.FTPPASSWORD;
const server = process.env.SERVER;

var { deductUserAmountBank, getUserAmount } = require('../api/unbelievaboat');

const getDinoGrowPrices = async () => {
    return JSON.parse(fs.readFileSync(growPricePath, `utf-8`));
}
const getDinoInjectPrices = async () => {
    return JSON.parse(fs.readFileSync(injectPricePath, 'utf-8'));
}
const getGeneralVariables = async () => {
    return JSON.parse(fs.readFileSync(generalVars, 'utf-8'));
}
async function deleteLocalFile(fileId) {
    console.log("Deleting local files . . .");
    fs.unlink("./" + fileId + ".json", (err) => {
        if (err) console.error(err);
    });
}

const handleDinoGrow = async(message, steamId, price, dinoName) => {
    if (!await downloadPlayerFile(message, steamId)) return false;
    if (!await editPlayerFile(message, steamId, dinoName, "grow")) return false;
    if (!await uploadPlayerFile(message, steamId, price)) return false;
    return true;
}

const handleDinoInject = async(message, steamId, price, dinoName) => {
    if (!await downloadPlayerFile(message, steamId)) return false;
    if (!await editPlayerFile(message, steamId, dinoName, "inject")) return false;
    if (!await uploadPlayerFile(message, steamId, price)) return false;
    return true;
}

const deleteServerFile = async (message, steamId) => {
    processing = true;
    console.log("Deleting file. . .");

    var ftpClient = new ftp.Client();
    ftpClient.ftp.ipFamily = 4;

    var price = await getGeneralVariables();
    price = price.slayCost;
    
    

    try {
        await ftpClient.access({
            host: ftpLocation,
            port:ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        var status = await ftpClient.remove(server + steamId + ".json");
        var retryCount = 0;
        while (status.code != 250 && retryCount < 2) {
            status = await ftpClient.remove(server + steamId + ".json");
            retryCount++;
        }
        if (status.code != 250) {
            console.error(`something went wrong deleting file from server.`);
            return false;
        }
        ftpClient.close();
        console.log(`successfully deleted file from server.`);
        return true;
    }catch(err){
        console.error("Error deleting file: " + err.message);
        ftpClient.close();
        return false;
    }
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

const editPlayerFile = async (message, steamId, dinoName, type) => {
    console.log(`Editing file for ${steamId}. . .`)
    try{
        var contents = JSON.parse(fs.readFileSync(`${steamId}.json`, `utf-8`));
        if(contents.bBrokenLegs) {
            message.reply(`please heal your leg before requesting a grow.`);
            deleteLocalFile(steamId);
            return false;
        }
        if(contents.BleedingRate.localeCompare("0") !== 0) {
            message.reply(`please heal your bleed before requesting a grow.`);
            deleteLocalFile(steamId);
            return false;
        }

        //Check if the user has this dino
        if (type == "grow") { 
            if(!contents.CharacterClass.toLowerCase().startsWith(dinoName.toLowerCase())) {
                message.reply(`you do not have that dino in game.`);
                deleteLocalFile(steamId);
                return false;
            }
            if (contents.Growth == "1.0") {
                message.reply(`you are either already fully grown or a full juvi. If you are a full juvi, log in and grow before buying a grow.`);
                deleteLocalFile(steamId);
                return false;
            }
        }
        if (type == "inject" && contents.CharacterClass.toLowerCase().startsWith(dinoName.toLowerCase())) {
            message.reply(`you cannot inject a dino you already have.`);
            deleteLocalFile(steamId);
            return false;
        }
        //Replacing dinoName with the code name for the dino
        var dinoPriceList;

        if (type == "grow") dinoPriceList = await getDinoGrowPrices();
        if (type == "inject") dinoPriceList = await getDinoInjectPrices()

        
        dinoPriceList.forEach(entry => {
            if(entry.Name.toLowerCase() == dinoName.toLowerCase()) {
                console.log(entry.CodeName);
                dinoName = entry.CodeName;
            }
        })
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
        deleteLocalFile(steamId);
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


module.exports = { handleDinoGrow, getDinoGrowPrices, getDinoInjectPrices, handleDinoInject, deleteServerFile }