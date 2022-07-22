import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Routes, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import fs from "fs"
import path from "path";

interface IBelCommand {
  name: string
  builder: SlashCommandBuilder
  run: (interaction: ChatInputCommandInteraction) => any
}

interface IBelConfig {
  commandsPath: string;
  intents?: GatewayIntentBits[]
  clientId: string
}

interface IBelClient {
  client: Client
  commands: Map<string, IBelCommand>
}

export const createBelClient = (token: string, config: IBelConfig): IBelClient => {
  const client = new Client({
    intents: [...(config.intents ?? []), GatewayIntentBits.Guilds]
  })
  const commandMap = new Map<string, IBelCommand>
  const commandFiles = fs.readdirSync(config.commandsPath).filter(file => file.endsWith(".js"))

  for (const file of commandFiles){
    const importedFile = require(path.join(config.commandsPath, file))
    const command: IBelCommand = importedFile.default

    if(!command) throw new Error("File does not export default")

    commandMap.set(command.name, command)
  }

  const commandBuilders = Array.from(commandMap.values()).map((cmd) => cmd.builder.toJSON())
  const rest = new REST({version: '9'}).setToken(token);

  (async () => {
    try {
      console.log("Refreshing application (/) commands...")

      await rest.put(
        Routes.applicationCommands(config.clientId),
        {
          body: commandBuilders
        }
        )

      console.log(`Refreshed ${commandMap.size} application (/) commands successfully`)
    } catch(err) {
      console.error(err)
    }
  })()

  return {
    client,
    commands: commandMap
  }
};
