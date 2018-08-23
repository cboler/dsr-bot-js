// Returns the list of HSTR teams
const hstrTeams = require("../data/hstrTeams.json");
const MAX_HSTR_TEAMS_PER_EMBED = 28;
const ALL_PHASES = ['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4_WITH_DN'];

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.react("🖐");
  let options = 'p';
  if (args.length) {
    options = args[args.length - 1];
    options = options.replace(new RegExp('-', 'g'), '');
    options = Array.from(options);
    if (options.indexOf('p') < 0 && options.indexOf('c') < 0) {
      options.push('p');
    }
    // if (options.indexOf('p') < 0 && options.indexOf('c') < 0 && options.indexOf('1') < 0 && options.indexOf('2') < 0 && options.indexOf('3') < 0 && options.indexOf('4') < 0 ) {
    //   await message.channel.send(`\`\`\`js\nError: Unrecognized option: ${options}.\n\`\`\``);
    //   await message.react("☠");
    //   return;
    // }
  }

  let dm = await message.channel;
  if (options.indexOf('p') >= 0) {
    dm = await message.author;
  }

  let phases = [];
  for(const o of options) {
    if (Number(o) && Number(o) >= 1 && Number(o) <= 4) {
      phases.push(ALL_PHASES[Number(o) - 1]);
    }
  }
  if(!phases.length) {
    phases = ALL_PHASES;
  }
  
  const msg = getHstrTeams(client.nameDict, phases);
  Object.keys(msg).sort().forEach(function (phase, i) {
    const teams = Object.keys(msg[phase]).sort();
    if (teams.length < MAX_HSTR_TEAMS_PER_EMBED) {
      const fields = [];
      for (const t in teams) {
        if(!teams.hasOwnProperty(t)) {
          continue;
        }        
        const team = teams[t];
        fields.push({ name: team, value: msg[phase][teams[t]] });
      }
      dm.send(client.createEmbed(`HSTR ${phase} Assignments`, fields));
    } else {
      const nb = Math.ceil(teams.length / MAX_HSTR_TEAMS_PER_EMBED);
      for (let i = 1; i < nb + 1; i++) {
        const fields = [];
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
  await message.react("👍");
};

function getHstrTeams(charMedia, phaseFilter) {
  const result = {};
  for (const phase of Object.keys(hstrTeams)) {
    if (phaseFilter.indexOf(phase) < 0) {
      continue;
    }
    const teams = hstrTeams[phase];
    result[phase] = {};
    for (const t1 of Object.keys(teams)) {
      const team = teams[t1];
      let s = '';
      for (const t2 in team['TOONS']) {
        if(!team['TOONS'].hasOwnProperty(t2)) {
          continue;
        }
        const toon = team['TOONS'][t2];
        if(charMedia.hasOwnProperty(toon)) {
          s += charMedia[toon] + ', ';
        } else {
          s += toon + ', ';
        }
      }
      s = s.slice(0, -2);
      if (team['ZETAS']) {
        s += '. Mandatory zetas: ';
        for (const z in team['ZETAS']) {
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
  usage: "sithraidteams (Options: [ p | c | 1 | 2 | 3 | 4 ])\nExamples: srt c\nsrt p134\np: private (sent via DM)\nc: channel (display in current channel)\n1, 2, 3, 4: show teams for each phase"
};