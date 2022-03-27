const Discord = require('discord.js');
const { fetchLinkedIds } = require('../api/steamManager');

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

async function slayEmbed (message) {
    const filter = m => m.author.id === message.author.id;
    const options = {
        max: 1,
        time: 300000
    };
    //Create embed to display instructions
    var slayEmbed = new Discord.MessageEmbed()
        .setTitle('Slay Menu')
        .setColor('#FF0000')
        .addFields(
            {name: 'Are you safelogged?',
            value: "Please type either:\nyes\nno"}
        )
        .setFooter(`User transaction: ${message.author.username}`);
    //Prompting user with embed
    message.reply(slayEmbed);
    
    var timedOut = false;
    var safelogged;
    await message.channel.awaitMessages(filter, options).then((collected)=>{safelogged = collected.first().content}).catch(() => {return timedOut = true;});    
    if(cancelCheck(safelogged)) return false;
    if (safelogged == undefined || safelogged == null || safelogged == "" || safelogged.toLowerCase() == "no" || safelogged.toLowerCase() == "n"){
        message.reply(`please safelog before continuing.`);
        return false;
    }
    if (safelogged.toLowerCase().localeCompare("yes") !== 0 && safelogged.toLowerCase().localeCompare("y") !== 0){
        message.reply(`please enter yes or no.`);   
        return false;                 
    }
    //Check for multiple steam IDs
    var steamId = await fetchLinkedIds(message.author.id);
    if(steamId.length > 1) {
        if (steamId.length > 1) {

            var msg = "";
            for(var x = 0; x < steamId.length; x++){
                msg += `${x+1}. ${steamId[x]} \n\n`;
            }
            slayEmbed.fields = [];
            slayEmbed.addFields({
            name: msg,
            value: `Please select one of your linked IDs. \n(Type either 1, 2, 3, ...)`
            });
            message.reply(slayEmbed);
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
            if(cancelCheck(steamIdSelection)) return false;
        }
    } else if (steamId.length == 1) {
        steamId = steamId[0];
    } else {
        message.reply(`could not find a steam ID. Please use the link command to link an ID.`);
        return false;
    }

    var confirm;
    //Update embed and prompt user with it
    slayEmbed.fields = [];
    slayEmbed.addFields({name: "Confirm slay?", value: "Please type either:\nyes\nno"});
    message.reply(slayEmbed);
    await message.channel.awaitMessages(filter, options).then((collected)=>{confirm = collected.first().content}).catch(() => {message.reply(`time ran out. Please try again`); return timedOut = true;});
    if(timedOut) {return false;}
    if(cancelCheck(confirm)) return false;
    if (confirm.toLowerCase() == "no" || confirm.toLowerCase() == "n") {
        message.reply(`you cancelled this request.`);
        return false;
    }
    if(confirm.toLowerCase().localeCompare("yes") !== 0 && confirm.toLowerCase().localeCompare("y") !== 0) {
        message.reply(`please enter yes or no.`);
        return false;
    }
    
    slayEmbed.fields = [];
    slayEmbed.setTitle("Please wait . . .");
    message.reply(slayEmbed);

    return [server, steamId];
}

module.exports = { slayEmbed }