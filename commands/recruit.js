// This command analyzes a roster for recruitment
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  message.react("🖐");
  if (!args.length) {
    message.channel.send(`\`\`\`js\nError: recruit needs an ally code.\n\`\`\``);
    message.react("☠");
    return;
  }
  allycode1 = args[0].replace(/-/g, '');
  if (!client.isAllyCode(allycode1)) {
    message.channel.send(`\`\`\`js\nError: ${args[0]} is not an ally code.\n\`\`\``);
    message.react("☠");
    return;
  }

  const playerData = await client.swapi.fetchPlayer(allycode1);
  const playerMods = await client.swapi.fetchPlayer(allycode1, 'mods');
  const charData = await client.swapi.fetchData('units');
  if (playerData.hasOwnProperty('error')) {
    message.channel.send(`\`\`\`js\nError: ${playerData.error}.\n\`\`\``);
    message.react("☠");
    return;
  }

  if (playerData.hasOwnProperty('response')) {
    message.channel.send(`\`\`\`js\nError: Request time out requesting roster for ${allycode1}\n\`\`\``);
    message.react("☠");
    return;
  }

  const stats = getPlayerStats(client, playerData);
  // message.channel.send(`\`\`\`js\n${guild1.name}: ${JSON.stringify(stats1)}\n\`\`\``);
  fields = [];
  Object.keys(stats).forEach(function (key) {
    let val = `${stats[key]}`;
    fields.push({ name: key, value: val });
  });
  message.channel.send(client.createEmbedInDescription(playerData.name, fields));
  const speedMods = getPlayerMods(client, playerMods.mods, 'Speed', 15);
  if (speedMods.length) {
    message.channel.send(client.createEmbed(`${playerData.name}'s Top 6 Speed Mods`, speedMods));
  } else {
    message.channel.send(client.createEmbed(`${playerData.name}'s Top 6 Speed Mods`, { name: '😦', value: 'No mods with speed secondary above 15.', inline: true }));
  }
  const offMods = getPlayerMods(client, playerMods.mods, 'Offense', 100);
  if (offMods.length) {
    message.channel.send(client.createEmbed(`${playerData.name}'s Top 6 Offense Mods`, offMods));
  } else {
    message.channel.send(client.createEmbed(`${playerData.name}'s Top 6 Ofense Mods`, { name: '😦', value: 'No mods with offense secondary above 100.', inline: true }));
  }
  message.react("👍");
};

function getPlayerStats(client, data) {
  res = {};
  res['Level'] = data.level;
  res['GP'] = client.numberWithCommas(data.gpFull);
  res['Character GP'] = client.numberWithCommas(data.gpChar);
  res['Ship GP'] = client.numberWithCommas(data.gpShip);
  res['Arena ranks (squad/fleet)'] = `Rank ${data.arena.char.rank} / Rank ${data.arena.ship.rank}`;
  res['Arena team'] = '\n';
  for (const toon in data.arena.char.squad) {
    if (!data.arena.char.squad.hasOwnProperty(toon)) {
      continue;
    }
    res['Arena team'] += data.arena.char.squad[toon].name + ', ';
    if (data.arena.char.squad[toon].type === 'Leader') {
      res['Arena team'] = res['Arena team'].slice(0, -2);
      res['Arena team'] += ` (${data.arena.char.squad[toon].type}), `;
    }
  }
  res['Arena team'] = res['Arena team'].slice(0, -2);
  let capShip = null;
  let startShips = [];
  let reinforcements = [];
  for (const ship in data.arena.ship.squad) {
    if (!data.arena.ship.squad.hasOwnProperty(ship)) {
      continue;
    }
    if (data.arena.ship.squad[ship].type === 'Capital Ship') {
      capShip = data.arena.ship.squad[ship].name;
    }
    if (data.arena.ship.squad[ship].type === 'Unit') {
      startShips.push(data.arena.ship.squad[ship].name);
    }
    if (data.arena.ship.squad[ship].type === 'Reinforcement') {
      reinforcements.push(data.arena.ship.squad[ship].name);
    }
  }
  res['Arena Fleet'] = `\n*Capital Ship*: ${capShip}\n*Starting lineup*: `;
  for (const ship in startShips) {
    if (!startShips.hasOwnProperty(ship)) {
      continue;
    }
    res['Arena Fleet'] += `${startShips[ship]}, `;
  }
  res['Arena Fleet'] = res['Arena Fleet'].slice(0, -2);
  res['Arena Fleet'] += '\n*Reinforcements*: ';
  for (const ship in reinforcements) {
    if (!reinforcements.hasOwnProperty(ship)) {
      continue;
    }
    res['Arena Fleet'] += `${reinforcements[ship]}, `;
  }
  res['Arena Fleet'] = res['Arena Fleet'].slice(0, -2);
  res['Traya'] = "No";
  res['Number of G11'] = 0;
  res['Number of G12'] = 0;
  data.roster.forEach(toon => {
    tempZetas = 0;
    isG11 = false;
    isG12 = false;
    if (toon.gear == 11) {
      res['Number of G11']++;
      isG11 = true;
    }
    if (toon.gear == 12) {
      res['Number of G12']++;
      isG12 = true;
    }

    const zetas = [];
    toon.skills.forEach(skill => {
      if (skill.isZeta && skill.tier >= 8) {
        zetas.push(`${skill.name} (${skill.type})`);
      }
    });

    switch (toon.defId) {
      case 'DARTHTRAYA':
        res['Traya'] = `Yes: Gear ${toon.gear}, ${toon.rarity} ⭐.`;
        if (zetas.length) {
          res['Traya'] += 'Zetas: ';
          for (z in zetas) {
            if (!zetas.hasOwnProperty(z)) {
              continue;
            }
            if (!zetas.hasOwnProperty(z)) {
              continue;
            }
            res['Traya'] += `${zetas[z]}, `;
          }
          res['Traya'] = res['Traya'].slice(0, -2);
          res['Traya'] += '.';
        }
        break;
    }
  });
  return res;
}

function getPlayerMods(client, data, type, minVal) {
  mods = [];
  for (d in data) {
    if (!data.hasOwnProperty(d)) {
      continue;
    }

    if (data[d].secondaryType_1 === type) {
      if (Number(data[d].secondaryValue_1) > minVal) {
        // mods.push(modToField(data[d], type));
        mods.push(data[d]);
        continue;
      }
    }
    if (data[d].secondaryType_2 === type) {
      if (Number(data[d].secondaryValue_2) > minVal) {
        mods.push(data[d]);
        continue;
      }
    }
    if (data[d].secondaryType_3 === type) {
      if (Number(data[d].secondaryValue_3) > minVal) {
        mods.push(data[d]);
        continue;
      }
    }
    if (data[d].secondaryType_4 === type) {
      if (Number(data[d].secondaryValue_4) > minVal) {
        mods.push(data[d]);
        continue;
      }
    }
  }
  switch (type) {
    case 'Speed':
      mods.sort(modSortSpeed);
      break;
    case 'Offense':
      mods.sort(modSortOffense);
      break;
  }
  mods = mods.slice(0, 6);
  mods = mods.reverse();
  let res = [];
  for (const m of Object.keys(mods)) {
    res.push(modToField(mods[m], type));
  }
  return res;
}

function modToField(mod, type) {
  let slot = null;
  switch (mod.slot) {
    case 'diamond':
      slot = '◆';
      break;
    case 'circle':
      slot = '●';
      break;
    case 'cross':
      slot = '+';
      break;
    case 'square':
      slot = '■';
      break;
    case 'arrow':
      slot = '➚';
      break;
    case 'triangle':
      slot = '▲';
      break;
  }
  let value = `\`\`\`asciidoc\n= ${mod.characterName} =\n`;
  if (mod.secondaryType_1 === type) {
    value += `[${mod.secondaryValue_1} ${mod.secondaryType_1}]\n`;
  } else {
    value += `${mod.secondaryValue_1} ${mod.secondaryType_1}\n`;
  }
  if (mod.secondaryType_2 === type) {
    value += `[${mod.secondaryValue_2} ${mod.secondaryType_2}]\n`;
  } else {
    value += `${mod.secondaryValue_2} ${mod.secondaryType_2}\n`;
  }
  if (mod.secondaryType_3 === type) {
    value += `[${mod.secondaryValue_3} ${mod.secondaryType_3}]\n`;
  } else {
    value += `${mod.secondaryValue_3} ${mod.secondaryType_3}\n`;
  }
  if (mod.secondaryType_4 === type) {
    value += `[${mod.secondaryValue_4} ${mod.secondaryType_4}]\n`;
  } else {
    value += `${mod.secondaryValue_4} ${mod.secondaryType_4}\n`;
  }
  value += `\`\`\``;
  return { name: `${mod.pips} dot ${mod.set} ${slot} ${mod.primaryBonusType} primary`, value: value, inline: true };
}

function modSortSpeed(a, b) {
  return modSort(a, b, 'Speed');
}

function modSortOffense(a, b) {
  return modSort(a, b, 'Offense');
}

function modSort(a, b, type) {
  let valA = 0;
  let valB = 0;
  if (a.secondaryType_1 == type) {
    valA = Number(a.secondaryValue_1);
  }
  if (a.secondaryType_2 == type) {
    valA = Number(a.secondaryValue_2);
  }
  if (a.secondaryType_3 == type) {
    valA = Number(a.secondaryValue_3);
  }
  if (a.secondaryType_4 == type) {
    valA = Number(a.secondaryValue_4);
  }
  if (b.secondaryType_1 == type) {
    valB = Number(b.secondaryValue_1);
  }
  if (b.secondaryType_2 == type) {
    valB = Number(b.secondaryValue_2);
  }
  if (b.secondaryType_3 == type) {
    valB = Number(b.secondaryValue_3);
  }
  if (b.secondaryType_4 == type) {
    valB = Number(b.secondaryValue_4);
  }

  return valA - valB;
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['r'],
  // permLevel: "Bot Owner"
  permLevel: "User"
};

exports.help = {
  name: "recruit",
  category: "Miscelaneous",
  description: "Gives relevant stats about a potential recruit.",
  usage: "recruit <allycode>"
};
