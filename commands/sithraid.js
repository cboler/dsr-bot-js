// Check for a guild's HSTR readiness
const hstrTeams = require("../data/hstrTeams.json");
const MAX_HSTR_TEAMS_PER_EMBED = 28;

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  message.react("🖐");
  if (!args.length) {
    message.channel.send(`\`\`\`js\nError: sithraid needs an ally code.\n\`\`\``);
    message.react("☠");
    return;
  }
  allycode = args[0].replace(/-/g, '');
  if (!client.isAllyCode(allycode)) {
    message.channel.send(`\`\`\`js\nError: ${args[0]} is not an ally code.\n\`\`\``);
    message.react("☠");
    return;
  }

  options = 'g';
  if (args.length > 1) {
    options = args[args.length - 1];
    options = options.replace(new RegExp('-', 'g'), '');
    options = Array.from(options);
    if (options.indexOf('g') < 0 && options.indexOf('p') < 0 && options.indexOf('d') < 0) {
      message.channel.send(`\`\`\`js\nError: Unrecognized option: ${options}.\n\`\`\``);
      message.react("☠");
      return;
    }
  }

  let guild = null;
  const zetaData = await client.swapi.fetchData('zetas');
  const charMedia = await client.swapi.fetchData('units');
  if (options.indexOf('p') >= 0) {
    player = await client.swapi.fetchPlayer(allycode);
    [msg, breakdown] = analyzeGuildHstrReadiness(client, [player], zetaData, charMedia);
  } else {
    guild = await client.swapi.fetchGuild(allycode);
    [msg, breakdown] = analyzeGuildHstrReadiness(client, guild.roster, zetaData, charMedia);
  }
  
  console.log(hstrTeams);
  fields = [];
  for (const m in msg) {
    if (!msg.hasOwnProperty(m)) {
      continue;
    }
    fields.push({ name: msg[m][0], value: msg[m][1] });
  }
  message.channel.send(client.createEmbed('HSTR Readiness', fields));
  // message.channel.send(`\`\`\`js\n${msg}.\n\`\`\``);
  // for (const phase in breakdown) {
  //   message.channel.send(`\`\`\`js\n${JSON.stringify(breakdown[phase])}.\n\`\`\``);
  // }

  if (options.indexOf('d') >= 0) {
    var dm = message.author;
    if (options.indexOf('c') >= 0) {
      dm = message.channel;
    }
    Object.keys(breakdown)
      .sort()
      .forEach(function (v, i) {
        teams = Object.keys(breakdown[v]).sort();
        if (teams.length < MAX_HSTR_TEAMS_PER_EMBED) {
          fields = [];
          for (const t in teams) {
            team = teams[t];
            if (!breakdown[v].hasOwnProperty(team)) {
              continue;
            }
            fields.push({ name: `${team} - ${breakdown[v][team]['comp']} (Goal: ${breakdown[v][team]['goal']}%) - eligibility: ${breakdown[v][team]['eligibility']}`, value: breakdown[v][team]['players'].join(", ") });
          }
          dm.send(client.createEmbed(`HSTR ${v} Assignments`, fields));
        } else {
          nb = Math.ceil(teams.length / MAX_HSTR_TEAMS_PER_EMBED);
          for (let i = 0; i < nb + 1; i++) {
            fields = [];
            for (const teamName in teams.slice((i - 1) * MAX_HSTR_TEAMS_PER_EMBED, i * i * MAX_HSTR_TEAMS_PER_EMBED < teams.length ? MAX_HSTR_TEAMS_PER_EMBED : teams.length)) {
              fields.push({ name: `${team} - ${breakdown[v][team]['comp']} (Goal: ${breakdown[v][team]['goal']}%) - eligibility: ${breakdown[v][team]['eligibility']}`, value: breakdown[v][team]['players'].join(", ") });
            }
            dm.send(client.createEmbed(`HSTR ${v} Assignments (${i}/${nb})`, fields));
          }
        }
      });

  }
  message.react("👍");
};

function createGuildDict(roster, zetaData) {
  d = {};
  roster.forEach(player => {
    d[player.name] = {};
    d[player.name]['zetas'] = [];
    player.roster.forEach(toon => {
      if (toon.rarity >= 7) {
        d[player.name][toon.defId] = toon;
        toon.skills.forEach(skill => {
          if (skill.isZeta && skill.tier >= 8) {
            zetaName = '';
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
  var globalDict = createGuildDict(roster, zetaData);

  readiness = {}
  for (var phase in hstrTeams) {
    var teams = hstrTeams[phase];
    var total = 100;
    if (phase == 'PHASE4_WITH_DN') {
      total = 95;
    }
    readiness[phase] = { 'remaining': total, 'teams': [] };
    var phaseReady = false;
    for (var player in globalDict) {
      if (phaseReady) {
        break;
      }
      var playerRoster = globalDict[player];

      var teamsLeft = true;
      while (teamsLeft) {
        var temp = {};
        for (var i in teams) {
          team = teams[i];
          var power = 0;
          var IDS = [];
          var playerZetas = playerRoster['zetas'];
          var teamZetas = null;
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
          for (var j in team['TOONS']) {
            toon = team['TOONS'][j];
            if (!playerRoster.hasOwnProperty(toon)) {
              break;
            }
            var playerToon = playerRoster[toon];
            power += playerToon.gp;
            IDS.push(toon);
          }
          if (power > team['MIN_GP']) {
            var eligibility = `Min GP: ${team['MIN_GP']}`;
            if (team.hasOwnProperty('ZETAS')) {
              eligibility += ` / required zetas: ${team['ZETAS'].join(", ")}`;
            }
            temp[team['NAME']] = { 'power': power, 'IDS': IDS, 'name': team['NAME'], 'goal': team['GOAL'], 'eligibility': eligibility };
          }
        }

        var max_gp = 0;
        var goal = 0;
        winner = null;
        for (var team_id in temp) {
          data = temp[team_id];
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
          for (var id in winner['IDS']) {
            toonID = winner['IDS'][id];
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
  var msg = [];
  var sorted = [];
  for (var key in readiness) {
    sorted[sorted.length] = key;
  }
  sorted.sort();
  for (k in sorted) {
    if (!readiness.hasOwnProperty(sorted[k])) {
      continue;
    }
    var phase = sorted[k];
    rem = readiness[phase]['remaining'];
    if (phase == 'PHASE4_WITH_DN' && readiness[phase]['remaining'] > 0) {
      rem = rem + 5;
    }
    msg.push([phase, `${100 - rem}% ready.`]);
  }

  var leftover_gp = 0;
  var nb_toons = 0;
  for (var player_name in globalDict) {
    toons = globalDict[player_name];
    for (var toon_name in toons) {
      toon_data = toons[toon_name];
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
    phase_data = readiness[phase];
    for (const team in phase_data['teams']) {
      for (const t in hstrTeams[phase]) {
        if (t['NAME'] == team['team_name']) {
          temp = t['TOONS'];
          var team_str = [];
          for (te in temp) {
            for (c in char_media) {
              if (c['base_id'] == te) {
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
  breakdown = {};
  var sorted = [];
  for (var key in readiness) {
    sorted[sorted.length] = key;
  }
  sorted.sort();
  for (k in sorted) {
    if (!readiness.hasOwnProperty(sorted[k])) {
      continue;
    }
    var v = sorted[k];
    breakdown[v] = {};
    for (t in readiness[v]['teams']) {
      if (!readiness[v]['teams'].hasOwnProperty(t)) {
        continue;
      }
      team = readiness[v]['teams'][t];
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
  usage: "sithraid <allycode> (Options: [ g | p | d | c ])\nExample: \nsithraid 123456789 -gdc\nsithraid 123456789 -p\ng: guild (default)\np: player\nd: details\nc: channel (display details in current channel)"
};