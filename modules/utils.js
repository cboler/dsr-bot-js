module.exports = (client) => {
  client.isAllyCode = code => {
    return /^([0-9]{9})$/.test(code);
  }

  client.checkOrGetAllyCode = async (code, authorId) => {
    if (/^([0-9]{9})$/.test(code)) {
      return code;
    }

    if (code === 'me') {
      const MongoClient = require('mongodb').MongoClient;
      const assert = require('assert');

      let mongoclient = await MongoClient.connect(client.config.mongodbConfig.url);

      let db = mongoclient.db('swgoh');
      try {
        const allycode = await db.collection("users").findOne({
          id: authorId
        });

        return allycode.allycode;
      }
      catch (error) {
        console.error(error);
      }
      finally {
        mongoclient.close();
      }
    }

    return false;
  }

  client.numberWithCommas = (x) => {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  client.createEmbed = (title, fields) => {
    const embed = {
      "title": title,
      "color": 16098851,
      "timestamp": (new Date()).toISOString(),
      "footer": {
        "icon_url": "https://cdn.discordapp.com/attachments/393068502128525313/471449797241602048/DSR_gold2.png",
        "text": "DSR Bot"
      },
      "fields": fields
    };
    return { embed };
  }

  client.createEmbedInDescription = (title, fields) => {
    description = '';
    for (f in fields) {
      if (!fields.hasOwnProperty(f)) {
        continue;
      }
      description += `**${fields[f].name}:** ${fields[f].value}\n`;
    }
    const embed = {
      "title": title,
      "color": 16098851,
      "timestamp": (new Date()).toISOString(),
      "footer": {
        "icon_url": "https://cdn.discordapp.com/attachments/393068502128525313/471449797241602048/DSR_gold2.png",
        "text": "DSR Bot"
      },
      "description": description
    };
    return { embed };
  }
};
