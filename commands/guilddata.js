const xl = require('excel4node');

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");
  if (!args.length) {
    await message.channel.send(`\`\`\`js\nError: gdata needs an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }
  const allycode = args[0].replace(/-/g, '');
  if (!client.isAllyCode(allycode)) {
    await message.channel.send(`\`\`\`js\nError: ${args[0]} is not an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }

  const guild = await client.swapi.fetchGuild({
    allycode: allycode
  });

  if (guild.hasOwnProperty('error')) {
    await message.channel.send(`\`\`\`js\nError: ${guild.error}.\n\`\`\``);
    await message.react("☠");
    return;
  }

  if (guild.hasOwnProperty('response')) {
    await message.channel.send(`\`\`\`js\nError: Request time out requesting roster for ${allycode}\n\`\`\``);
    await message.react("☠");
    return;
  }

  let allyCodes = guild.roster.map(r => r.allyCode);
  const roster = await client.swapi.fetchPlayer({ allycode: allyCodes });
  // // get unit's list from: /swgoh/units
  // let units = await client.swapi.fetchUnits({ allycode: allyCodes });
  // // pass whole units object to crinolo's api
  // let rosterStats = await client.swapi.rosterStats(units);

  const stats = await getStats(client, roster);

  var wb = new xl.Workbook();
  var ws = wb.addWorksheet(guild.name);
  for (var i = 0; i < stats.length; i++) {
    for (var j = 0; j < stats[i].length; j++) {
      if (j === 0 || i === 0) {
        ws.cell(i + 1, j + 1).string(stats[i][j]);
      } else {
        ws.cell(i + 1, j + 1).number(stats[i][j]);
      }
    }
  }

  var buffer = await wb.writeToBuffer();
  await message.channel.send('File:', {
    files: [{
      attachment: buffer,
      name: `${guild.name}.xlsx`
    }]
  });
  await message.react("👍");
};

async function getStats(client, roster) {
  const data = [];
  data.push(['Name', 'Total GP', 'Character GP', 'Fleet GP', 'Arena', 'Fleet Arena', 'G11', 'G12', 'Zetas', 'Mods +10 speed', 'Mods +15 speed', 'Nest Speed']);

  for (const r of Object.keys(roster)) {
    const element = roster[r];
    const stats = await client.swapi.rosterStats(element.roster);
    let d = [];
    d.push(element.name);
    d.push(element.gpFull);
    d.push(element.gpChar);
    d.push(element.gpShip);
    d.push(element.arena.char.rank);
    d.push(element.arena.ship.rank);
    let g11 = 0;
    let g12 = 0;
    let zetas = 0;
    let mod10 = 0;
    let mod15 = 0;
    for (const t of Object.keys(element.roster)) {
      const toon = element.roster[t];
      let tempZetas = 0;
      if (toon.gear === 11) {
        g11++;
      }
      if (toon.gear === 12) {
        g12++;
      }

      for (const s of Object.keys(toon.skills)) {
        const skill = toon.skills[s];
        if (skill.isZeta && skill.tier >= 8) {
          zetas++;
        }
      }

      for (const m of Object.keys(toon.mods)) {
        const mod = toon.mods[m];
        if (mod.secondaryType_1 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_1 >= 1000000000) {
            mod10++;
            continue;
          }
          if (mod.secondaryValue_1 >= 1500000000) {
            mod15++;
            continue;
          }
        }
        if (mod.secondaryType_2 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_2 >= 1000000000) {
            mod10++;
            continue;
          }
          if (mod.secondaryValue_2 >= 1500000000) {
            mod15++;
            continue;
          }
        }
        if (mod.secondaryType_3 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_3 >= 1000000000) {
            mod10++;
            continue;
          }
          if (mod.secondaryValue_3 >= 1500000000) {
            mod15++;
            continue;
          }
        }
        if (mod.secondaryType_4 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_4 >= 1000000000) {
            mod10++;
            continue;
          }
          if (mod.secondaryValue_4 >= 1500000000) {
            mod15++;
            continue;
          }
        }
      }

      if (toon.defId === 'ENFYSNEST') {

      }
    }
    d.push(g11);
    d.push(g12);
    d.push(zetas);
    d.push(mod10);
    data.push(d);
  }
  return data;
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['gd'],
  permLevel: "Bot Support"
};

exports.help = {
  name: "guilddata",
  category: "Miscelaneous",
  description: "Gives relevant stats about your roster.",
  usage: "guilddata <allycode>"
};
