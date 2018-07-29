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
  const charMedia = await client.swapi.fetchData('units');
  msg = getHstrTeams(charMedia);
  Object.keys(msg).sort.forEach(function (v, i) {

  });
  return;
  fields = [];
  for (const m in msg) {
    if (!msg.hasOwnProperty(m)) {
      continue;
    }
    fields.push({ name: msg[m][0], value: msg[m][1] });
  }
  message.channel.send(client.createEmbed('HSTR Readiness', fields));

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
          if (c['base_id'] == toon) {
            s += c['name'] + ', ';
            break;
          }
          s = s.slice(0, -2);
          if (team['ZETAS']) {
            s += '. Mandatory zetas: ';
            for (z in team['ZETAS']) {
              s += team['ZETAS'] + ', ';
            }
            s = s.slice(0, -2);
          }
          s += `'. Goal: ${team['GOAL']}%`;
          result[phase][team['NAME']] = s;
        }
      }
    }
  }
  return result;
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['srt'],
  permLevel: "Bot Owner"
};

exports.help = {
  name: "sithraidteams",
  category: "Raid",
  description: "List of HSTR teams.",
  usage: "sithraid (Options: [ p | c ])\np: private (sent via DM)\nc: channel (display in current channel)"
};