module.exports = (client) => {
  client.isAllyCode = code => {
   return /^([0-9]{9})$/ .test(code);
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
    return {embed};
  }
};
