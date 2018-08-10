// Check for a guild's HSTR readiness
const hstrTeams = require("../data/hstrTeams.json");
const MAX_HSTR_TEAMS_PER_EMBED = 28;

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");
  if (!args.length) {
    await message.channel.send(`\`\`\`js\nError: sithraid needs an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }
  const allycode = args[0].replace(/-/g, '');
  if (!client.isAllyCode(allycode)) {
    await message.channel.send(`\`\`\`js\nError: ${args[0]} is not an ally code.\n\`\`\``);
    await message.react("☠");
    return;
  }

  let options = 'g';
  if (args.length > 1) {
    options = args[args.length - 1];
    options = options.replace(new RegExp('-', 'g'), '');
    options = Array.from(options);
    if (options.indexOf('g') < 0 && options.indexOf('p') < 0 && options.indexOf('d') < 0) {
      await message.channel.send(`\`\`\`js\nError: Unrecognized option: ${options}.\n\`\`\``);
      await message.react("☠");
      return;
    }
  }

  let title = 'HSTR Readiness';
  let msg = null;
  let breakdown = null;
  const zetaData = await client.swapi.fetchData('zetas');
  const charMedia = await client.swapi.fetchData('units');
  if (options.indexOf('p') >= 0) {
    const player = await client.swapi.fetchPlayer(allycode);
    title = player.name;
    [msg, breakdown] = analyzeGuildHstrReadiness(client, [player], zetaData, charMedia);
  } else {
    const guild = await client.swapi.fetchGuild(allycode);
    title = guild.name;
    [msg, breakdown] = analyzeGuildHstrReadiness(client, guild.roster, zetaData, charMedia);
  }

  const fields = [];
  for (const m in msg) {
    if (!msg.hasOwnProperty(m)) {
      continue;
    }
    fields.push({ name: msg[m][0], value: msg[m][1] });
  }
  await message.channel.send(client.createEmbed(title, fields));

  if (options.indexOf('d') >= 0) {
    let dm = await message.author;
    if (options.indexOf('c') >= 0) {
      dm = await message.channel;
    }
    Object.keys(breakdown)
      .sort()
      .forEach(function (v, i) {
        const teams = Object.keys(breakdown[v]).sort();
        if (teams.length < MAX_HSTR_TEAMS_PER_EMBED) {
          const fieldsBD = [];
          for (const t in teams) {
            const team = teams[t];
            if (!breakdown[v].hasOwnProperty(team)) {
              continue;
            }
            fieldsBD.push({ name: `${team} - ${breakdown[v][team]['comp']} (Goal: ${breakdown[v][team]['goal']}%) - eligibility: ${breakdown[v][team]['eligibility']}`, value: breakdown[v][team]['players'].join(", ") });
          }
          dm.send(client.createEmbed(`${title}'s HSTR ${v} Assignments`, fieldsBD));
        } else {
          const nb = Math.ceil(teams.length / MAX_HSTR_TEAMS_PER_EMBED);
          for (let i = 0; i < nb + 1; i++) {
            const fieldsBD = [];
            for (const teamName in teams.slice((i - 1) * MAX_HSTR_TEAMS_PER_EMBED, i * i * MAX_HSTR_TEAMS_PER_EMBED < teams.length ? MAX_HSTR_TEAMS_PER_EMBED : teams.length)) {
              fieldsBD.push({ name: `${team} - ${breakdown[v][team]['comp']} (Goal: ${breakdown[v][team]['goal']}%) - eligibility: ${breakdown[v][team]['eligibility']}`, value: breakdown[v][team]['players'].join(", ") });
            }
            dm.send(client.createEmbed(`${title}'s HSTR ${v} Assignments (${i}/${nb})`, fieldsBD));
          }
        }
      });

  }
  await message.react("👍");
};

function createGuildDict(roster, zetaData) {
  const d = {};
  roster.forEach(player => {
    d[player.name] = {};
    d[player.name]['zetas'] = [];
    player.roster.forEach(toon => {
      if (toon.rarity >= 7) {
        d[player.name][toon.defId] = toon;
        toon.skills.forEach(skill => {
          if (skill.isZeta && skill.tier >= 8) {
            let zetaName = '';
            if (zetaData.hasOwnProperty(skill.name)) {
              zetaName = zetaData[skill.name].name;
            } else {
              zetaName = skill.name;
            }
            d[player.name]['zetas'].push(zetaName);
          }
        });
      }
    });
  });
  return d;
}

function analyzeGuildHstrReadiness(client, roster, zetaData, char_media) {
  let globalDict = createGuildDict(roster, zetaData);

  const readiness = {};
  for (let phase in hstrTeams) {
    let teams = hstrTeams[phase];
    let total = 100;
    if (phase == 'PHASE4_WITH_DN') {
      total = 95;
    }
    readiness[phase] = { 'remaining': total, 'teams': [] };
    let phaseReady = false;
    for (let player in globalDict) {
      if (phaseReady) {
        break;
      }
      const playerRoster = globalDict[player];

      let teamsLeft = true;
      while (teamsLeft) {
        let temp = {};
        for (let i in teams) {
          const team = teams[i];
          let power = 0;
          let IDS = [];
          let playerZetas = playerRoster['zetas'];
          let teamZetas = null;
          if (team.hasOwnProperty('ZETAS')) {
            teamZetas = team.ZETAS;
          }

          if (teamZetas) {
            if (!playerZetas.length) {
              continue;
            }
            const setTeamZetas = new Set(teamZetas);
            const setPlayerZetas = new Set(playerZetas);
            const diff = new Set([...setTeamZetas].filter(x => !setPlayerZetas.has(x)));
            if (diff.size) {
              continue;
            }
          }
          for (let j in team['TOONS']) {
            const toon = team['TOONS'][j];
            if (!playerRoster.hasOwnProperty(toon)) {
              break;
            }
            let playerToon = playerRoster[toon];
            power += playerToon.gp;
            IDS.push(toon);
          }
          if (power > team['MIN_GP']) {
            let eligibility = `Min GP: ${team['MIN_GP']}`;
            if (team.hasOwnProperty('ZETAS')) {
              eligibility += ` / required zetas: ${team['ZETAS'].join(", ")}`;
            }
            temp[team['NAME']] = { 'power': power, 'IDS': IDS, 'name': team['NAME'], 'goal': team['GOAL'], 'eligibility': eligibility };
          }
        }

        let max_gp = 0;
        let goal = 0;
        let winner = null;
        for (let team_id in temp) {
          const data = temp[team_id];
          if (data['goal'] > goal) {
            winner = data;
            max_gp = data['power'];
            goal = data['goal'];
          } else if (data['goal'] == goal && data['power'] > max_gp) {
            winner = data;
            max_gp = data['power'];
          }
        }

        if (winner) {
          readiness[phase]['remaining'] -= winner['goal'];
          readiness[phase]['teams'].push(
            {
              'player_name': player, 'team_name': winner['name'], 'goal': winner['goal'],
              'eligibility': winner['eligibility']
            });
          for (let id in winner['IDS']) {
            const toonID = winner['IDS'][id];
            delete globalDict[player][toonID];
          }
          if (readiness[phase]['remaining'] <= 0) {
            readiness[phase]['remaining'] = 0;
            phaseReady = true;
            break;
          }
        } else {
          teamsLeft = false;
        }
      }
    }
  }
  let msg = [];
  let sorted = [];
  for (let key in readiness) {
    sorted[sorted.length] = key;
  }
  sorted.sort();
  for (k in sorted) {
    if (!readiness.hasOwnProperty(sorted[k])) {
      continue;
    }
    let phase = sorted[k];
    let rem = readiness[phase]['remaining'];
    if (phase == 'PHASE4_WITH_DN' && readiness[phase]['remaining'] > 0) {
      rem = rem + 5;
    }
    msg.push([phase, `${100 - rem}% ready.`]);
  }

  let leftover_gp = 0;
  let nb_toons = 0;
  for (let player_name in globalDict) {
    const toons = globalDict[player_name];
    for (let toon_name in toons) {
      const toon_data = toons[toon_name];
      if (toon_data['gp'] > 10000) {
        leftover_gp += toon_data['gp'];
        nb_toons += 1;
      }
    }
  }
  msg.push(["Leftover GP for P4 (toons over 10k GP only):", client.numberWithCommas(leftover_gp)]);
  msg.push(["Number of toons left for P4 (toons over 10k GP only):", client.numberWithCommas(nb_toons)]);
  msg.push([
    "Average:",
    `${(leftover_gp / 50).toFixed(2)} GP left for P4 per player (${(leftover_gp / nb_toons * 5).toFixed(2)} gp per team, toons over 10k GP only).`]);
  msg.push(["Average:",
    `${(nb_toons / 50).toFixed(2)} toons left for P4 per player (${((nb_toons / 50) / 5).toFixed(2)} teams).`]);

  for (const phase in readiness) {
    const phase_data = readiness[phase];
    for (const dataTeam in phase_data['teams']) {
      const team = phase_data['teams'][dataTeam];
      for (const ht in hstrTeams[phase]) {
        const t = hstrTeams[phase][ht];
        if (t['NAME'] == team['team_name']) {
          const temp = t['TOONS'];
          let team_str = [];
          for (te in temp) {
            const tem = temp[te];
            for (cID in char_media) {
              const c = char_media[cID];
              if (cID == tem) {
                team_str.push(c['name']);
                break;
              }
            }
          }

          team_str[0] = `${team_str[0]} Lead`;
          team_str = team_str.join(", ");
          team['comp'] = team_str;
          break;
        }
      }
    }
  }
  return [msg, create_breakdown(readiness)];
}

function create_breakdown(readiness) {
  const breakdown = {};
  const sorted = [];
  for (let key in readiness) {
    sorted[sorted.length] = key;
  }
  sorted.sort();
  for (k in sorted) {
    if (!readiness.hasOwnProperty(sorted[k])) {
      continue;
    }
    let v = sorted[k];
    breakdown[v] = {};
    for (t in readiness[v]['teams']) {
      if (!readiness[v]['teams'].hasOwnProperty(t)) {
        continue;
      }
      const team = readiness[v]['teams'][t];
      if (!breakdown[v].hasOwnProperty(team['team_name'])) {
        breakdown[v][team['team_name']] = {
          'goal': team['goal'], 'comp': team['comp'], 'eligibility': team['eligibility'],
          'players': []
        };
      }
      breakdown[v][team['team_name']]['players'].push(team['player_name']);
    }
  }
  return breakdown;
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['sr'],
  permLevel: "User"
};

exports.help = {
  name: "sithraid",
  category: "Raid",
  description: "Check for a guild or player's readiness to the HSTR.",
  usage: "sithraid <allycode> (Options: [ g | p | d | c ])\nExample: \nsithraid 123456789 gdc\nsithraid 123456789 p\ng: guild (default)\np: player\nd: details\nc: channel (display details in current channel)"
};