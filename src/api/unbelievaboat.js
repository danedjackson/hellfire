const axios = require('axios');

async function getUserAmount(guildID, userID) {
    return await axios.get(process.env.UNBELIEVABOAT_URL + "/guilds/" + guildID + "/users/" + userID, {
            headers: {
                'Authorization': process.env.UNBELIEVABOAT_TOKEN
            }
        })
        .then(function (response) {
            // handle success
            bank = response.data.bank;
        })
        .catch(function (error) {
            // handle error
            console.error("Error: " + error.message);
            return false;
        })
        .then(function () {
            // always executed
            return bank;
        }
    );
}


async function deductUserAmountBank(guildID, userID, price) {
    return await axios.patch(process.env.UNBELIEVABOAT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "0",
        bank: "-" + price
    }, 
    {
        headers: {
            'Authorization': process.env.UNBELIEVABOAT_TOKEN
        }
    })
    .then(function () {
        return true;
    })
    .catch(function (error) {
        console.error("Error: " + error.message);
        return false;
    });
}

async function addUserAmountBank(guildID, userID, amount) {
    return await axios.patch(process.env.UNBELIEVABOAT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "0",
        bank: amount
    }, 
    {
        headers: {
            'Authorization': process.env.UNBELIEVABOAT_TOKEN
        }
    })
    .then(function (response) {
        return true;
    })
    .catch(function (error) {
        console.error("Error: " + error.message);
        return false;
    });
}

module.exports = { getUserAmount, deductUserAmountBank, addUserAmountBank }