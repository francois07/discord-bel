import { ApplicationCommandType, ContextMenuCommandBuilder, ContextMenuCommandInteraction } from "discord.js";
import { BelCommand } from "../..";

const FavoriteContext: BelCommand = {
  builder: new ContextMenuCommandBuilder().setName("Favorite").setType(ApplicationCommandType.Message),
  run: (interaction: ContextMenuCommandInteraction) => {
    return interaction.reply({
      ephemeral: true,
      content: `Added ${interaction.targetId} to favorites`
    })
  }
}

export default FavoriteContext