const Discord = require('discord.js');
const discordClient = new Discord.Client();

var { menuEmbed } = require("./embeds/menu-embed");

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
        var option = menuEmbed(message);

        if ( !option ) return;

        if ( option.toLowerCase() === "g" ) {
            //Call grow function here
        }
        else if ( option.toLowerCase() === "i" ) {
            //Call Inject funtion
        }
        else if ( option.toLowerCase() === "s" ) {
            //Call Slay funtion
        }
    }
})


discordClient.login("OTU1MjM3NzMxNDI3MDQ1NDE2.Yjewdg.kbm8Qe4H3IH20J6_xCc_eoM5tcg");
