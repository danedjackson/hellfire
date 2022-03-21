const Discord = require('discord.js');

async function menuEmbed (message) {
    var timedOut = false;
    var option;

    //Setting controls for embed
    //TODO: Possibly change time and color to be dynamic instead of hardcoded
    const filter = m => m.author.id === message.author.id;
    const options = {
        max: 1,
        time: 200000
    };
    const prompt = new Discord.MessageEmbed()
        .setTitle(`Menu`)
        .setColor(`#f4fc03`)
        .addFields(
            {
                name: `Please select an option`,
                value:`Grow\nInjection\nSlay`
            }
        )
        .setFooter(`User transaction: ${message.author.username}`);
    //Displays embed
    message.reply(prompt);

    //Waits for user input
    await message.channel.awaitMessages(filter, options)
            .then( collected => {
                option = collected.first().content
            })
            .catch(() =>{
                message.reply(`time's up. Please try again.`);
                return timedOut = true;
            });
    if (timedOut) return false;

    //Checks user input
    if(option.toLowerCase().startsWith("g") || option.toLowerCase().startsWith("i") || option.toLowerCase().startsWith("s")) {
        return option;
    }
    else if(option.toLowerCase() === "cancel") {
        message.reply("you cancelled the process.");
        return false;
    }
    else {
        message.reply("invalid selection. Please try again.");
        return false;
    }
}

module.exports = { menuEmbed }