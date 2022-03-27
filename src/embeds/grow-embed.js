const Discord = require('discord.js');
var { getDinoGrowPrices } = require('../functions/file-manager');

function cancelCheck( msg) {
    if (msg === undefined || msg == null || msg == "") return true;
    try {
        if (msg.toLowerCase().indexOf("cancel") != -1) {
            return true;
        }
    } catch (err) {
        console.err(`Error comparing value to "cancel" string\n${err}`);
        return false;
    }
    return false;
}

async function growEmbed(message) {
    var timedOut = false;
    var safelogged;

    const filter = m => m.author.id === message.author.id;
    const options = {
        max: 1,
        time: 200000
    };
    const prompt = new Discord.MessageEmbed()
        .setTitle(`Grow Menu`)
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

    var dinoPriceList = await getDinoGrowPrices();
    var prices = "";
    for (var x = 0; x < dinoPriceList.length; x++) {
        prices += `${dinoPriceList[x].Name}\t:\t🔥${dinoPriceList[x].GrowPrice.toLocaleString()}\n`;
    }
    prompt.addFields(
        {
            name: `🦎 Type the name of the dino you want to grow 🦎`, 
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
            price = dinoPriceList[x].GrowPrice;
            dinoFound = true;
            break;
        }
    }
    if (!dinoFound) {
        message.reply(`invalid dino, please try again.`);
        return false;
    }
    prompt.fields = [];
    var steamId;
    prompt.addFields( {
        name: `Please enter your steam ID`,
        value: `[17 digit code starting with 7656].`
    } );
    message.reply(prompt);
    await message.channel.awaitMessages(filter, options)
        .then( collected => 
            steamId = collected.first().content
        )
        .catch( () => {
            message.reply(`time's up. Please try again.`);
            return timedOut = true;
        } );
    if(timedOut) return false;
    if (cancelCheck(steamId)) {
        message.reply(`you canceled the request.`);
        return false;
    }
    if(!steamId.startsWith('7656')) {
        message.reply(`that is an invalid steam ID, please try again.`);
        return false;
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
        return [dino, price, steamId];
    }
    message.reply(`transaction cancelled.`);
    return false;
};
module.exports = { growEmbed }