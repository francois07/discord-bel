import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { BelCommand } from "../..";

const PingCommand: BelCommand = {
  builder: new SlashCommandBuilder().setName("ping").setDescription("Basic ping command"),
  run: (interaction: ChatInputCommandInteraction) => {
    return interaction.reply({
      ephemeral: true,
      content: "Pong!"
    })
  }
}

export default PingCommand