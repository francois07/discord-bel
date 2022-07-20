"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    name: "ping",
    builder: new discord_js_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping command with a twist !")
        .addStringOption((option) => option
        .setName("input")
        .setDescription("What the bot will reply to you")
        .setMaxLength(15)),
    run: (interaction) => {
        console.log(interaction.options.data);
        const str = interaction.options.getString("input");
        interaction.reply(str !== null && str !== void 0 ? str : "Erreur");
    },
};
