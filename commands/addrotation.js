var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

// this directory stores all the rotations
var rotationDir = './rotations';
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");

  if (!args.length) {
    await message.channel.send("Error: addrotation requires a list of names.");
    await message.react("☠");
    return;
  }

  // Connect to the db
  const mc = await MongoClient.connect(client.config.mongoUrl, { useNewUrlParser: true });
  await message.channel.send(JSON.stringify(args));

  // check if the rotation directory exists. If it doesn't create it.
  if (!fs.existsSync(rotationDir)) {
    fs.mkdirSync(rotationDir);
  }
  for (const a of args) {

  }

  await message.react("👍");
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['ar'],
  // permLevel: "Bot Owner"
  permLevel: "User"
};

exports.help = {
  name: "addrotation",
  category: "Miscelaneous",
  description: "Bind a shard rotation in the current channel.",
  usage: "addrotation <player1> <player2> ..."
};