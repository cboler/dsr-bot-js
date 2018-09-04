// This command has two usages:
// 1. with one argument: will return data for tw
// 2. with 2 arguments: will compare data between 2 allycode's guilds for tw
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");
  if (!args.length) {
    await message.channel.send(`\`\`\`js\nError: tw needs an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }
  const allycode1 = args[0].replace(/-/g, '');
  if (!client.isAllyCode(allycode1)) {
    await message.channel.send(`\`\`\`js\nError: ${args[0]} is not an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }

  const guild1 = await client.swapi.fetchGuild({
    allycode: allycode1
  });

  if (guild1.hasOwnProperty('error')) {
    await message.channel.send(`\`\`\`js\nError: ${guild1.error}.\n\`\`\``);
    await message.react("☠");
    return;
  }

  if (guild1.hasOwnProperty('response')) {
    await message.channel.send(`\`\`\`js\nError: Request time out requesting roster for ${allycode1}\n\`\`\``);
    await message.react("☠");
    return;
  }

  let allyCodes1 = guild1.roster.map(r => r.allyCode);
  const roster1 = await client.swapi.fetchPlayer({ allycode: allyCodes1 });

  const stats1 = await getGuildStats(client, roster1);

  const fields = [];
  let val = '';
  let lfill = 0;

  if (args.length > 1) {
    const allycode2 = args[1].replace(/-/g, '');
    if (!client.isAllyCode(allycode2)) {
      await message.channel.send(`\`\`\`js\nError: ${args[1]} is not an ally code.\n\`\`\``);
      await message.react("☠");
      return;
    }
    const guild2 = await client.swapi.fetchGuild({
      allycode: allycode2
    });

    if (guild2.hasOwnProperty('error')) {
      await message.channel.send(`\`\`\`js\nError: ${guild2.error}\n\`\`\``);
      await message.react("☠");
      return;
    }

    if (guild2.hasOwnProperty('response')) {
      await message.channel.send(`\`\`\`js\nError: Request time out requesting roster for ${allycode2}\n\`\`\``);
      await message.react("☠");
      return;
    }


    let allyCodes2 = guild2.roster.map(r => r.allyCode);
    const roster2 = await client.swapi.fetchPlayer({ allycode: allyCodes2 });

    const stats2 = await getGuildStats(client, roster2);

    for (const key of Object.keys(stats1)) {
      val = `${stats1[key]} vs ${stats2[key]}`;
      lfill = (55 - val.length) / 2;
      if (lfill < 0) {
        lfill = 0;
      }
      val = `${' '.repeat(lfill)}${val}`;
      fields.push({ name: key, value: `\`\`\`js\n${val}\`\`\`` });
    }
    await message.channel.send(client.createEmbed(guild1.name + " vs " + guild2.name, fields));
  } else {
    for (const key of Object.keys(stats1)) {
      val = `${stats1[key]}`;
      lfill = (55 - val.length) / 2;
      if (lfill < 0) {
        lfill = 0;
      }
      val = `${' '.repeat(lfill)}${val}`;
      fields.push({ name: key, value: `\`\`\`js\n${val}\`\`\`` });
    }
    await message.channel.send(client.createEmbed(guild1.name, fields));
  }
  await message.react("👍");
};

async function getGuildStats(client, roster) {
  const res = {};
  res['Members'] = roster.length;
  res['Total GP'] = 0;
  res['Average Arena Rank'] = 0;
  res['Average Fleet Arena Rank'] = 0;
  res['Number of Trayas'] = 0;
  res['Number of zzTrayas'] = 0;
  res['Number of G11+ Trayas'] = 0;
  res['Number of G11+ Magmatroopers'] = 0;
  res['Number of G11+ Enfys Nest'] = 0;
  res['Number of zBastilla'] = 0;
  res['Number of G11'] = 0;
  res['Number of G12'] = 0;
  res['Number of Zetas'] = 0;
  for (const r of Object.keys(roster)) {
    const element = roster[r];
    res['Total GP'] += element.stats.filter(o => o.nameKey == 'STAT_GALACTIC_POWER_ACQUIRED_NAME')[0].value;
    res['Average Arena Rank'] += element.arena.char.rank;
    res['Average Fleet Arena Rank'] += element.arena.ship.rank;

    for (const t of Object.keys(element.roster)) {
      const toon = element.roster[t];
      let tempZetas = 0;
      let isG11 = false;
      let isG12 = false;
      if (toon.gear === 11) {
        res['Number of G11']++;
        isG11 = true;
      }
      if (toon.gear === 12) {
        res['Number of G12']++;
        isG12 = true;
      }

      for (const s of Object.keys(toon.skills)) {
        const skill = toon.skills[s];
        if (skill.isZeta && skill.tier >= 8) {
          res['Number of Zetas']++;
          tempZetas++;
        }
      }

      switch (toon.defId) {
        case 'DARTHTRAYA':
          res['Number of Trayas']++;
          if (tempZetas >= 2) {
            res['Number of zzTrayas']++;
          }
          if (isG11 || isG12) {
            res['Number of G11+ Trayas']++;
          }
          break;
        case 'MAGMATROOPER':
          if (isG11 || isG12) {
            res['Number of G11+ Magmatroopers']++;
          }
          break;
        case 'BASTILASHAN':
          if (tempZetas >= 1) {
            res['Number of zBastilla']++;
          }
          break;
          case 'ENFYSNEST':
            if (isG11 || isG12) {
              res['Number of G11+ Enfys Nest']++;
            }
          break;
      }
    }
  }
  res['Total GP'] = client.numberWithCommas(res['Total GP']);
  res['Average Arena Rank'] /= roster.length;
  res['Average Arena Rank'] = res['Average Arena Rank'].toFixed(2);
  res['Average Fleet Arena Rank'] /= roster.length;
  res['Average Fleet Arena Rank'] = res['Average Fleet Arena Rank'].toFixed(2);
  return res;
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "tw",
  category: "Arena",
  description: "Gives relevant stats about TW for your guild, or compares 2 guilds.",
  usage: "tw <allycode1> (Optional: <allycode2>)"
};
