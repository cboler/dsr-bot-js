module.exports = (client) => {

  const SET_ENUM = [undefined, 'HEALTH', 'OFFENSE', 'DEFENSE', 'SPEED', 'CRIT CHANCE', 'CRIT DAMAGE', 'POTENCY', 'TENACITY'];
  const SLOT_ENUM = ['SQUARE', 'ARROW', 'DIAMOND', 'TRIANGLE', 'CIRCLE', 'CROSS'];
  const STATS_ENUM = {
    'UNITSTATSPEED': 'Speed',
    'UNITSTATCRITICALCHANCEPERCENTADDITIVE': 'Critical Chance %',
    'UNITSTATCRITICALDAMAGE': 'Critical Damage',
    'UNITSTATACCURACY': 'Potency',
    'UNITSTATRESISTANCE': 'Tenacity',
    'UNITSTATEVASIONNEGATEPERCENTADDITIVE': 'Accuracy %',
    'UNITSTATCRITICALNEGATECHANCEPERCENTADDITIVE': 'Critical Avoidance %',
    'UNITSTATOFFENSE': 'Offense',
    'UNITSTATOFFENSEPERCENTADDITIVE': 'Offense %',
    'UNITSTATDEFENSE': 'Defense',
    'UNITSTATDEFENSEPERCENTADDITIVE': 'Defense %',
    'UNITSTATMAXHEALTH': 'Health',
    'UNITSTATMAXHEALTHPERCENTADDITIVE': 'Health %',
    'UNITSTATMAXSHIELD': 'Protection',
    'UNITSTATMAXSHIELDPERCENTADDITIVE': 'Protection %'
  };

  client.getModsFromPlayer = (x) => {
    console.log(x);
    const mods = [];
    for (const unit of Object.keys(x)) {
      if (!x.hasOwnProperty(unit)) {
        continue;
      }

      for (var i = 0; i < x[unit][0].mods.length; i++) {
        const formattedMod = client.formatMod(x[unit][0].mods[i], unit, i);
        if (Object.keys(formattedMod).length !== 0) {
          mods.push(formattedMod);
        }
      }
    }
    return mods;
  }

  client.formatMod = (mod, unit, i) => {
    if (!mod.level) {
      return {};
    }

    const formattedMod = {
      unit: unit,
      set: SET_ENUM[mod.set],
      slot: SLOT_ENUM[i],
      level: mod.level,
      pips: mod.pips
    };

    if (mod.stat) {
      formattedMod['primary'] = client.formatModStat(mod.stat[0]);
      formattedMod['secondary_1'] = client.formatModStat(mod.stat[1]);
      formattedMod['secondary_2'] = client.formatModStat(mod.stat[2]);
      formattedMod['secondary_3'] = client.formatModStat(mod.stat[3]);
      formattedMod['secondary_4'] = client.formatModStat(mod.stat[4]);
    }
    return formattedMod;
  }

  client.formatModStat = (stat) => {
    if (stat[0] === 0) {
      return [];
    }
    const name = STATS_ENUM[stat[0]];
    var value = stat[1];
    // if (name.includes('PERCENTADDITIVE')) {
    //   value /= 1000000;
    // } else {
    value /= 100000000;
    if (name.includes('PERCENTADDITIVE')) {
      value = value.toFixed(2);
    }
    // }
    return [name, value];
  }
};

