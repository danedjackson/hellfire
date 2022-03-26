const Discord = require('discord.js');
const discordClient = new Discord.Client();
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const PREFIX = process.env.PREFIX;

var { menuEmbed } = require("./embeds/menu-embed");
var { growEmbed } = require("./embeds/grow-embed");
var { handleDinoGrow } = require("./functions/file-manager");
var { injectEmbed } = require('./embeds/inject-embed');
const { addSteamID, addAlt } = require('./api/steamManager');

var insultList = [
    "hi scrub",
    "git gud",
    "hello stinky"
]

discordClient.on("message", async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(PREFIX)) return;

    //Assigning message contents to command name and arguments
    const [cmdName, ...args] = message.content
        .trim()
        .substring("!".length)
        .split(/ +/g);

    if (cmdName === "hi") {
        return message.reply(insultList[Math.floor(Math.random() * insultList.length)]);
    }

    if (cmdName === "menu") {
        //Display embed for menu option
        var option = await menuEmbed(message);

        if ( !option ) return;
    
        if ( option.toLowerCase().startsWith("g")) {
            //Call grow function here
            var growResponse;
            growResponse = await growEmbed(message);

            if (!growResponse) return false;
            
            console.log(growResponse);

            if(!await handleDinoGrow(message, growResponse[2], growResponse[1], growResponse[0])) return false;

            return message.reply("Successfully grown your dino. Please log in to the game.");

        }
        else if ( option.toLowerCase().startsWith("i")) {
            //Call Inject funtion
            var injectResponse = await injectEmbed(message);
            console.log(injectResponse);
        }
        else if ( option.toLowerCase().startsWith("s")) {
            //Call Slay funtion
            return message.reply("Not yet implemented, will be here soon!")
        }
    }

    if (cmdName === "link") {
        if(args.length != 1 || !args[0].startsWith('7656')) return message.reply(`please link a valid steam ID`);
        if(await addSteamID(message.author.id, args[0])) return message.reply(`successfully linked your ID`);
        message.reply(`something went wrong while linking this ID, please check if it is valid and try again.`);
    }

    if (cmdName === "link-alt") {
        if(args.length != 1 || !args[0].startsWith('7656')) return message.reply(`please link a valid steam ID`);
        await addAlt(message, message.author.id, args[0]);
    }
})


discordClient.login(TOKEN);
