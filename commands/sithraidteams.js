// Returns the list of HSTR teams
const hstrTeams = require("../data/hstrTeams.json");
const MAX_HSTR_TEAMS_PER_EMBED = 28;

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  message.react("🖐");
  options = 'p';
  if (args.length) {
    options = args[args.length - 1];
    options = options.replace(new RegExp('-', 'g'), '');
    options = Array.from(options);
    if (options.indexOf('p') < 0 && options.indexOf('c')) {
      message.channel.send(`\`\`\`js\nError: Unrecognized option: ${options}.\n\`\`\``);
      message.react("☠");
      return;
    }
  }

  let dm = message.channel;
  if (options.indexOf('p') >= 0) {
    dm = message.author;
  }

  const charMedia = await client.swapi.fetchData('units');
  msg = getHstrTeams(charMedia);
  Object.keys(msg).sort().forEach(function (phase, i) {
    teams = Object.keys(msg[phase]).sort();
    if (teams.length < MAX_HSTR_TEAMS_PER_EMBED) {
      fields = [];
      for (const t in teams) {
        if(!teams.hasOwnProperty(t)) {
          continue;
        }        
        team = teams[t];
        fields.push({ name: team, value: msg[phase][teams[t]] });
      }
      dm.send(client.createEmbed(`HSTR ${phase} Assignments`, fields));
    } else {
      nb = Math.ceil(teams.length / MAX_HSTR_TEAMS_PER_EMBED);
      for (let i = 1; i < nb + 1; i++) {
        fields = [];
        for (const teamidx in teams.slice((i - 1) * MAX_HSTR_TEAMS_PER_EMBED, i * i * MAX_HSTR_TEAMS_PER_EMBED < teams.length ? MAX_HSTR_TEAMS_PER_EMBED : teams.length)) {
          if(!teams.hasOwnProperty(teamidx)) {
            continue;
          }
          fields.push({ name: teams[teamidx], value: msg[phase][teams[teamidx]] });
        }
        dm.send(client.createEmbed(`HSTR Teams for ${phase} (${i}/${nb})`, fields));
      }
    }
  });
  message.react("👍");
};

function getHstrTeams(charMedia) {
  result = {};
  for (const phase of Object.keys(hstrTeams)) {
    teams = hstrTeams[phase];
    result[phase] = {};
    for (const t1 of Object.keys(teams)) {
      team = teams[t1];
      let s = '';
      for (const t2 in team['TOONS']) {
        toon = team['TOONS'][t2];
        for (c in charMedia) {
          if (c === toon) {
            s += charMedia[c].name + ', ';
            break;
          }
        }
      }
      s = s.slice(0, -2);
      if (team['ZETAS']) {
        s += '. Mandatory zetas: ';
        for (z in team['ZETAS']) {
          if (team['ZETAS'].hasOwnProperty(z)) {
            s += team['ZETAS'][z] + ', ';
          }
        }
        s = s.slice(0, -2);
      }
      s += `'. Goal: ${team['GOAL']}%`;
      result[phase][team['NAME']] = s;
    }
  }
  return result;
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['srt'],
  // permLevel: "Bot Owner"
  permLevel: "User"
};

exports.help = {
  name: "sithraidteams",
  category: "Raid",
  description: "List of HSTR teams.",
  usage: "sithraid (Options: [ p | c ])\nExample: ,srt c\np: private (sent via DM)\nc: channel (display in current channel)"
};