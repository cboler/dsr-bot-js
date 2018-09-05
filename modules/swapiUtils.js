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
    const mods = [];
    for (const unit of Object.keys(x)) {
      if (!x.hasOwnProperty(unit)) {
        continue;
      }

      for (var i = 0; i < x[unit].mods.length; i++) {
        const formattedMod = client.formatMod(x[unit].mods[i], x[unit].defId, i);
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

    formattedMod['primary'] = client.formatModStat(mod.primaryBonusType, mod.primaryBonusValue);
    formattedMod['secondary_1'] = client.formatModStat(mod.secondaryType_1, mod.secondaryValue_1);
    formattedMod['secondary_2'] = client.formatModStat(mod.secondaryType_2, mod.secondaryValue_2);
    formattedMod['secondary_3'] = client.formatModStat(mod.secondaryType_3, mod.secondaryValue_3);
    formattedMod['secondary_4'] = client.formatModStat(mod.secondaryType_4, mod.secondaryValue_4);
    return formattedMod;
  }

  client.formatModStat = (type, value) => {
    if(!type) {
      return [];
    }
    const name = STATS_ENUM[type];
    value /= 100000000;
    if (name.includes('PERCENTADDITIVE')) {
      value = value.toFixed(2);
    }
    // }
    return [name, value];
  }
};

