const Discord = require('discord.js');
const discordClient = new Discord.Client();
require('dotenv').config();

const TOKEN = process.env.TOKEN;

var { menuEmbed } = require("./embeds/menu-embed");
var { growEmbed } = require("./embeds/grow-embed");

var insultList = [
    "hi scrub",
    "git gud",
    "hello stinky"
]

discordClient.on("message", async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith("!")) return;

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
            await growEmbed(message);
        }
        else if ( option.toLowerCase().startsWith("i")) {
            //Call Inject funtion
        }
        else if ( option.toLowerCase().startsWith("s")) {
            //Call Slay funtion
        }
    }
})


discordClient.login(TOKEN);
