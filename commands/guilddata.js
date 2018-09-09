const xl = require('excel4node');
const reducer = (accumulator, currentValue) => accumulator + currentValue;

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");
  if (!args.length) {
    await message.channel.send(`\`\`\`js\nError: gdata needs an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }
  let allycode = args[0].replace(/-/g, '');
  if (!client.isAllyCode(allycode)) {
    await message.channel.send(`\`\`\`js\nError: ${args[0]} is not an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }
  allycode = Number(allycode);

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
  const roster = await client.swapi.fetchPlayer({
    allycodes: allyCodes,
    enums: true
  });

  if (roster.hasOwnProperty('response')) {
    await message.channel.send(`\`\`\`js\nError: Request time out\n\`\`\``);
    await message.react("☠");
    return;
  }
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
  
  var ws2 = wb.addWorksheet('TW farm');
  const twFarm = await getTWFarm(client, roster);
  for (var i = 0; i < twFarm.length; i++) {
    for (var j = 0; j < twFarm[i].length; j++) {
      if (j === 0 || i === 0) {
        ws2.cell(i + 1, j + 1).string(twFarm[i][j]);
      } else {
        ws2.cell(i + 1, j + 1).number(twFarm[i][j]);
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
  data.push(['Name', 'Total GP', 'Character GP', 'Fleet GP', 'Arena', 'Fleet Arena', 'G11', 'G12', 'Zetas', 'Mods +10 speed', 'Mods +15 speed']);
  data[0].push(...['Qi\'ra', 'L3-37', 'Vandor Chewie', 'Big Z', 'Enfys Nest', 'Scoundrels GP']);
  data[0].push(...['Bossk', 'Boba Fett', 'IG88', 'Dengar', 'Greedo', 'BH GP']);
  data[0].push(...['KRU', 'Kylo', 'fost', 'foe', 'foo', 'FO GP']);
  data[0].push(...['Traya', 'Sion', 'DN', 'SithT', 'Dooku', 'Sith GP']);
  for (const r of Object.keys(roster)) {
    const element = roster[r];
    const stats = await client.swapi.rosterStats(element.roster);
    let d = [];
    d.push(element.name);
    d.push(element.stats.filter(o => o.nameKey == 'STAT_GALACTIC_POWER_ACQUIRED_NAME')[0].value);
    d.push(element.stats.filter(o => o.nameKey == 'STAT_CHARACTER_GALACTIC_POWER_ACQUIRED_NAME')[0].value);
    d.push(element.stats.filter(o => o.nameKey == 'STAT_SHIP_GALACTIC_POWER_ACQUIRED_NAME')[0].value);
    d.push(element.arena.char.rank);
    d.push(element.arena.ship.rank);
    let g11 = 0;
    let g12 = 0;
    let zetas = 0;
    let mod10 = 0;
    let mod15 = 0;
    let scoundrels = Array(6).fill(0);
    let bh = Array(6).fill(0);
    let fo = Array(6).fill(0);
    let sith = Array(6).fill(0);

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
          }
          if (mod.secondaryValue_1 >= 1500000000) {
            mod15++;
            continue;
          }
        }
        if (mod.secondaryType_2 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_2 >= 1000000000) {
            mod10++;
          }
          if (mod.secondaryValue_2 >= 1500000000) {
            mod15++;
            continue;
          }
        }
        if (mod.secondaryType_3 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_3 >= 1000000000) {
            mod10++;
          }
          if (mod.secondaryValue_3 >= 1500000000) {
            mod15++;
            continue;
          }
        }
        if (mod.secondaryType_4 === 'UNITSTATSPEED') {
          if (mod.secondaryValue_4 >= 1000000000) {
            mod10++;
          }
          if (mod.secondaryValue_4 >= 1500000000) {
            mod15++;
            continue;
          }
        }
      }

      if (toon.defId === 'QIRA') {
        scoundrels[0] = toon.gp;
      } else if (toon.defId === 'L3_37') {
        scoundrels[1] = toon.gp;
      } else if (toon.defId === 'YOUNGCHEWBACCA') {
        scoundrels[2] = toon.gp;
      } else if (toon.defId === 'ZAALBAR') {
        scoundrels[3] = toon.gp;
      } else if (toon.defId === 'ENFYSNEST') {
        scoundrels[4] = toon.gp;
      }

      if (toon.defId === 'BOSSK') {
        bh[0] = toon.gp;
      } else if (toon.defId === 'DENGAR') {
        bh[1] = toon.gp;
      } else if (toon.defId === 'IG88') {
        bh[2] = toon.gp;
      } else if (toon.defId === 'GREEDO') {
        bh[3] = toon.gp;
      } else if (toon.defId === 'BOBAFETT') {
        bh[4] = toon.gp;
      }

      if (toon.defId === 'KYLORENUNMASKED') {
        fo[0] = toon.gp;
      } else if (toon.defId === 'KYLOREN') {
        fo[1] = toon.gp;
      } else if (toon.defId === 'FIRSTORDERTROOPER') {
        fo[2] = toon.gp;
      } else if (toon.defId === 'FIRSTORDEREXECUTIONER') {
        fo[3] = toon.gp;
      } else if (toon.defId === 'FIRSTORDEROFFICERMALE') {
        fo[4] = toon.gp;
      }

      if (toon.defId === 'DARTHTRAYA') {
        sith[0] = toon.gp;
      } else if (toon.defId === 'DARTHSION') {
        sith[1] = toon.gp;
      } else if (toon.defId === 'DARTHNIHILUS') {
        sith[2] = toon.gp;
      } else if (toon.defId === 'SITHTROOPER') {
        sith[3] = toon.gp;
      } else if (toon.defId === 'COUNTDOOKU') {
        sith[4] = toon.gp;
      }
    }
    d.push(g11);
    d.push(g12);
    d.push(zetas);
    d.push(mod10);
    d.push(mod15);
    scoundrels[5] = scoundrels.slice(0, 4).reduce(reducer);
    bh[5] = bh.slice(0, 4).reduce(reducer);
    fo[5] = fo.slice(0, 4).reduce(reducer);
    sith[5] = sith.slice(0, 4).reduce(reducer);
    d.push(...scoundrels);
    d.push(...bh);
    d.push(...fo);
    d.push(...sith);
    data.push(d);
  }
  return data;
}

async function getTWFarm(client, roster) {
  const data = [];
  // 0
  data.push(['Name']);
  // 1-10
  data[0].push(...['Darth Traya', 'Darth Traya zetas', 'Darth Sion', 'Darth Sion zetas', 'Darth Nihilus', 'Darth Nihilus zetas', 'Sith Trooper', 'Count Dooku', 'Count Dooku zetas', 'Sith Assassin']);
  // 11-20
  data[0].push(...['Qi\'ra', 'Qi\'ra zetas', 'Vandor Chewbacca', 'Vandor Chewbacca zetas', 'Zaalbar', 'Zaalbar zetas', 'Enfys Nest', 'Enfys Nest zetas', 'L3-37', 'L3-37 zetas']);
  // 21-36
  data[0].push(...['Bossk', 'Bossk zetas', 'Boba Fett', 'Boba zetas', 'Greedo', 'Greedo zetas', 'Dengar', 'Dengar zetas', 'Embo', 'Embo zetas', 'IG-88', 'IG-88 zetas', 'Zam Wesell', 'Zam Wesell zetas', 'Aurra Sing', 'Aurra Sing zetas']);
  // 37-52
  data[0].push(...['Kylo Ren (Unmasked)', 'Kylo Ren (Unmasked) zetas', 'Kylo Ren', 'Kylo Ren zetas', 'First Order Officer', 'First Order Officer zetas', 'First Order Stormtrooper', 'First Order Stormtrooper zetas', 'First Order Executioner', 'First Order Executioner zetas', 'Barriss Offee', 'Barriss Offee zetas', 'First Order SF TIE Pilot', 'First Order SF TIE Pilot zetas', 'First Order TIE Pilot', 'First Order TIE Pilot zetas']);
  const l = data[0].length;
  for (const r of Object.keys(roster)) {
    const element = roster[r];
    let d = new Array(l).fill(0);
    d[0] = element.name;

    for (const t of Object.keys(element.roster)) {
      const toon = element.roster[t];

      if (toon.defId === 'DARTHTRAYA') {
        d[1] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[2]++;
          }
        }
      } else if (toon.defId === 'DARTHSION') {
        d[3] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[4]++;
          }
        }
      } else if (toon.defId === 'DARTHNIHILUS') {
        d[5] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[6]++;
          }
        }
      } else if (toon.defId === 'SITHTROOPER') {
        d[7] = toon.gear;
      } else if (toon.defId === 'COUNTDOOKU') {
        d[8] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[9]++;
          }
        }
      } else if (toon.defId === 'SITHASSASSIN') {
        d[10] = toon.gear;
      }

      if (toon.defId === 'QIRA') {
        d[11] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[12]++;
          }
        }
      } else if (toon.defId === 'YOUNGCHEWBACCA') {
        d[13] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[14]++;
          }
        }
      } else if (toon.defId === 'ZAALBAR') {
        d[15] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[16]++;
          }
        }
      } else if (toon.defId === 'ENFYSNEST') {
        d[17] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[18]++;
          }
        }
      } else if (toon.defId === 'L3_37') {
        d[19] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[20]++;
          }
        }
      }

      if (toon.defId === 'BOSSK') {
        d[21] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[22]++;
          }
        }
      } else if (toon.defId === 'BOBAFETT') {
        d[23] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[24]++;
          }
        }
      } else if (toon.defId === 'GREEDO') {
        d[25] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[26]++;
          }
        }
      } else if (toon.defId === 'DENGAR') {
        d[27] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[28]++;
          }
        }
      } else if (toon.defId === 'EMBO') {
        d[29] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[30]++;
          }
        }
      } else if (toon.defId === 'IG88') {
        d[31] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[32]++;
          }
        }
      } else if (toon.defId === 'ZAMWESELL') {
        d[33] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[34]++;
          }
        }
      } else if (toon.defId === 'AURRA_SING') {
        d[35] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[36]++;
          }
        }
      }

      if (toon.defId === 'KYLORENUNMASKED') {
        d[37] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[38]++;
          }
        }
      } else if (toon.defId === 'KYLOREN') {
        d[39] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[40]++;
          }
        }
      } else if (toon.defId === 'FIRSTORDEROFFICERMALE') {
        d[41] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[42]++;
          }
        }
      } else if (toon.defId === 'FIRSTORDERTROOPER') {
        d[43] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[44]++;
          }
        }
      } else if (toon.defId === 'FIRSTORDEREXECUTIONER') {
        d[45] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[46]++;
          }
        }
      } else if (toon.defId === 'BARRISSOFFEE') {
        d[47] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[48]++;
          }
        }
      } else if (toon.defId === 'FIRSTORDERSPECIALFORCESPILOT') {
        d[49] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[50]++;
          }
        }
      } else if (toon.defId === 'FIRSTORDERTIEPILOT') {
        d[51] = toon.gear;
        for (const s of toon.skills) {
          if (s.isZeta && s.tier >= 8) {
            d[52]++;
          }
        }
      }
    }
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
