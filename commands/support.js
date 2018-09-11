
exports.run = async (client, message, args, level) => {
  await message.channel.send(`Come join ${message.client.user} Support Server!\n 
  https://discord.gg/YCurwRp \n`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [""],
  permLevel: "User"
};

exports.help = {
  name: "support",
  category: "Miscelaneous",
  description: "Join DSR Bot Support Server!",
  usage: "Support"
};
