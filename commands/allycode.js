const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// this directory stores all the rotations
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");

  let mongoclient = await MongoClient.connect(client.config.mongodbConfig.url);

  let db = mongoclient.db('swgoh');
  try {
    const allycode = await db.collection("users").findOne({
      id: message.author.id
    });

    console.log(allycode);
    await message.channel.send(`Your allycode is: ${allycode.allycode}`);

    await message.react("👍");
  }
  catch (error) {
    console.error(error);
    await message.channel.send(`Could not find your allycode. Use "register <allycode>" to set it up!`);
    await message.react("☠");
  }
  finally {
    mongoclient.close();
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['ac'],
  // permLevel: "Bot Owner"
  permLevel: "User"
};

exports.help = {
  name: "allycode",
  category: "Miscelaneous",
  description: "Returns your allycode",
  usage: "allycode"
};