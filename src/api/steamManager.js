const fs = require('fs');
const axios = require('axios');
const path = require('path');
const steamKey = process.env.STEAMKEY;
const MAXIDs = 2;

const getSteamJson = () => {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, "../json/steam-id.json")));
}

const writeSteamJson = (steamInfo) => {
    fs.writeFileSync(path.resolve(__dirname, "../json/steam-id.json"), JSON.stringify(steamInfo, null, 4));
}

async function checkIDValid(id) {
    try {
        var response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamKey}&format=json&steamids=${id}`);
        if (response.data.response.players == "" || response.data.response.players== null || response.data.response.players == undefined ) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        console.error(`Could not check steam ID info: ${err}`);
    }
}

async function steamIdExists(steamId, steamInfo){
    var found = false;
    for (var x = 0; x < steamInfo.length; x++){
        for(var i = 0; i < steamInfo[x].SteamID.length; i++) {
            if (steamId == steamInfo[x].SteamID[i]) {
                found = true;
            }
        }
    }
    return found;
}

async function fetchLinkedIds(discordId) {
    var steamInfo = getSteamJson();
    var Ids = null;
    for (var x = 0; x < steamInfo.length; x++) {
        if(discordId == steamInfo[x].User) {
            Ids = steamInfo[x].SteamID;
        }
    }
    return Ids;
}

//Return the selected steam ID given the Discord ID and Steam ID Position
async function selectID(discordId, selectedId) {
    var steamInfo = getSteamJson();
    var userIds;
    try  {
        selectedId -= 1
        if (selectedId < 0) return false;
        for (var x = 0; x < steamInfo.length; x++) {
            if (discordId == steamInfo[x].User)
                userIds = steamInfo[x].SteamID;
        }

        return userIds[selectedId];
    }
    catch (err) {
        console.error(`Something went wrong picking steam ID: ${err}`);
        return false;
    }
}

async function getSteamID (id) {
    var steamInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../json/steam-id.json")));
    for (var x = 0; x < steamInfo.length; x++) {
        if (id == steamInfo[x].User)
            return steamInfo[x].SteamID[0];
    }
    return false;
}
async function updateSteamID (id, oldID, newID) {
    let userID = id.substring(3, id.length-1);
    if (!await checkIDValid(newID)) return false;
    var steamInfo = getSteamJson();
    //Search if new ID already exists
    if (await steamIdExists(newID, steamInfo)) return false; 
    //Search for user
    for (var x = 0; x < steamInfo.length; x++) {
        //Found user
        if (userID == steamInfo[x].User){
            //find old ID
            for(var i = 0; i < steamInfo[x].SteamID.length; i++){
                if(oldID == steamInfo[x].SteamID[i]){
                    //Update user
                    steamInfo[x].SteamID[i] = newID;
                    writeSteamJson(steamInfo);
                    return true;
                }
            }
        }
    }
    return false;
}
async function addSteamID (userID, steamID) {
    if(!await checkIDValid(steamID)) return false;
    var steamInfo = getSteamJson();
    if (await steamIdExists(steamID, steamInfo)) return false;
    //Search for user
    for (var x = 0; x < steamInfo.length; x++) {
        //Found user
        if (userID == steamInfo[x].User){
            //User already exists
            //Check if ID was deleted, if so, update
            if (steamInfo[x].SteamID.length <= 0) {
                steamInfo[x].SteamID = [steamID];
                writeSteamJson(steamInfo);
                return true;
            }
            return false;
        }
    }
    //Replacing every character that is not a digit with empty.
    steamID = steamID.replace(/\D/g, '');
    steamInfo.push({
        "User": userID,
        "SteamID": [steamID]
    });
    writeSteamJson(steamInfo);
    return true;
}

async function removeAllSteamIDs (discordId) {
    var steamInfo = getSteamJson();
    //Search for steam ID
    for (var i = 0; i < steamInfo.length; i++) {
        if(discordId == steamInfo[i].User) {
            steamInfo.splice(i, 1);
            writeSteamJson(steamInfo);
            return true;
        }
    }
    return false;
}

async function removeSteamID (steamID) {
    var steamInfo = getSteamJson();
    //Search for steam ID
    try {
        for (var i = 0; i < steamInfo.length; i++) {
            for( var x = 0; x < steamInfo[i].SteamID.length; x++ ){
                if(steamID == steamInfo[i].SteamID[x]) {
                    steamInfo[i].SteamID.splice(x, 1);
                    writeSteamJson(steamInfo);
                    return true;
                }
            }
        }
    } catch (err) {
        console.error(`Something went wrong removing steam ID: ${err}`);
        return false;
    }
    return false;
}

async function addAlt(message, discordId, steamId) {
    var steamInfo = getSteamJson();
    if (!await checkIDValid(steamId)) return message.reply(`that steam id doesn't look right....`);
    if (await steamIdExists(steamId, steamInfo)) return message.reply(`steam ID already linked`);
    for (var i = 0; i < steamInfo.length; i++) {
        if(discordId == steamInfo[i].User) {
            if(steamInfo[i].SteamID[0] == undefined || steamInfo[i].SteamID[0] == "") {
                return message.reply(`there are no IDs linked. Use the link command to link your ID.`)
            }
            for (var x = 0; x < MAXIDs; x++) {
                console.log(steamInfo[i].SteamID[x]);
                if (steamInfo[i].SteamID[x] == undefined) {
                    steamId = steamId.replace(/\D/g, '');
                    steamInfo[i].SteamID[x] = steamId;
                    writeSteamJson(steamInfo);
                    return message.reply(`successfully linked alt steam ID`);
                }
            }
            return message.reply(`you have the max amount of alt IDs linked`);
        }
    }
    return message.reply(`there are no IDs linked. Use the link command to link your ID.`)
}

module.exports = {getSteamID, updateSteamID, addSteamID, removeSteamID, addAlt, fetchLinkedIds}