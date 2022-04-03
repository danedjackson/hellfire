const Discord = require('discord.js');
var { getDinoInjectPrices } = require('../functions/file-manager');
const { fetchLinkedIds } = require('../api/steamManager');

function cancelCheck( msg) {
    if (msg === undefined || msg == null || msg == "") return true;
    try {
        if (msg.toLowerCase().indexOf("cancel") != -1) {
            return true;
        }
    } catch (err) {
        console.error(`Error comparing value to "cancel" string\n${err}`);
        return false;
    }
    return false;
}

async function injectEmbed(message) {
    var timedOut = false;
    var safelogged;

    const filter = m => m.author.id === message.author.id;
    const options = {
        max: 1,
        time: 200000
    };
    const prompt = new Discord.MessageEmbed()
        .setTitle(`Inject Menu`)
        .setColor(`#f4fc03`)
        .addFields(
            {
                name: `Are you safelogged?`,
                value:`Please respond with:\nyes\nno`
            }
        )
        .setFooter(`User transaction: ${message.author.username}`);
    
    message.reply(prompt);
    await message.channel.awaitMessages(filter, options)
            .then( collected => {
                safelogged = collected.first().content
            })
            .catch(() =>{
                message.reply(`time's up. Please try again.`);
                return timedOut = true;
            });
    if (timedOut) return false;
    if(safelogged.toLowerCase().startsWith("n")) {
        message.reply(`you need to be safelogged to grow a dino. Please safelog and try again.`);
        return false;
    }

    prompt.fields = [];

    var dinoPriceList = await getDinoInjectPrices();
    var prices = "";
    for (var x = 0; x < dinoPriceList.length; x++) {
        prices += `${dinoPriceList[x].Name}\t:\t🔥${dinoPriceList[x].InjectPrice.toLocaleString()}\n`;
    }
    prompt.addFields(
        {
            name: `🦎 Type the name of the dino you want to inject 🦎`, 
            value: prices
        }
    );

    var dino;
    var price;
    var dinoFound = false;
    message.reply(prompt);
    await message.channel.awaitMessages(filter, options)
        .then( collected => {
            dino = collected.first().content
        } )
        .catch( () => {
            message.reply(`time's up. Please try again.`);
            return timedOut = true;
        });
    if (timedOut) return false;
    if (cancelCheck(dino)) {
        message.reply(`you canceled the request.`);
        return false;
    }
    for (var x = 0; x < dinoPriceList.length; x++) {
        if( dino.toLowerCase() == dinoPriceList[x].Name.toLowerCase() ) {
            price = dinoPriceList[x].InjectPrice;
            dinoFound = true;
            break;
        }
    }
    if (!dinoFound) {
        message.reply(`invalid dino, please try again.`);
        return false;
    }
    
    prompt.fields = [];
    var gender;
    prompt.addFields({name: "What gender are you requesting?", 
                      value: "Please type either:\nMale\nFemale"});
    message.reply(prompt);
    await message.channel.awaitMessages(filter, options)
        .then((collected)=>{
            gender = collected.first().content
        })
        .catch( () => {
            message.reply(`time ran out. Please try again`); 
            return timedOut = true;
        });
    if (timedOut) return false;
    if(cancelCheck(gender)) return false;
    if(gender.toLowerCase().localeCompare("m") !== 0 && gender.toLowerCase().localeCompare("f") !== 0 
            && gender.toLowerCase().localeCompare("female") !== 0 && gender.toLowerCase().localeCompare("male") !== 0) {
                message.reply(`invalid gender, please try again.`);
                return false;
    }

    //TODO:Call linked IDs here
    var steamId = await fetchLinkedIds(message.author.id);
    if (steamId == null || steamId == undefined) {
        message.reply(`you have no steam IDs linked. Please link your ID and try again.`);
        return false;
    }
    if (steamId.length > 1) {

        var msg = "";
        for(var x = 0; x < steamId.length; x++){
            msg += `${x+1}. ${steamId[x]} \n\n`;
        }
        prompt.fields = [];
        prompt.addFields({
        name: msg,
        value: `Please select one of your linked IDs. \n(Type either 1, 2, 3, ...)`
        });
        message.reply(prompt);
        await message.channel.awaitMessages(filter, options)
            .then(collected => {
                steamIdSelection = collected.first().content;
                try {
                    steamIdSelection = parseInt(steamIdSelection);
                } catch(err) {
                    console.error(`Error occurred parsing steam ID selection: ${err}`);
                    message.reply(`you entered something invalid, please try again.`);
                    return timedOut = true;
                }
                console.log(typeof steamIdSelection);
                if (typeof steamIdSelection == "number") {
                    steamId = steamId[steamIdSelection-1];
                    if (steamId == undefined || steamId == null){
                        message.reply("could not find steam ID.");
                        return timedOut = true;
                    }
                }
            })
            .catch( () => {
                message.reply(`time ran out. Please try again`);
                return timedOut = true;
            });
        if(timedOut) return false;
        if(cancelCheck(message, steamIdSelection)) return false;
        
    }

    prompt.fields = [];
    var confirm;
    prompt.addFields( {
        name: `Confirm your order of a ${dino}.`,
        value: `Please type either:\nyes\nno`
    });
    message.reply(prompt);
    await message.channel.awaitMessages(filter, options)
        .then( collected => {
            confirm = collected.first().content
        } )
        .catch( () => {
            message.reply(`time's up. Please try again.`);
            return timedOut = true;
        } );
    if(timedOut) return false;

    if (confirm.toLowerCase().startsWith("y")) {
        prompt.fields = [];
        prompt.setTitle(`Please wait for the transaction to be completed.`);
        message.reply(prompt);
        return [dino, price, steamId, gender];
    }
    message.reply(`transaction cancelled.`);
    return false;
};
module.exports = { injectEmbed }