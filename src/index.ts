import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Routes, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import fs from "fs"
import path from "path";
import { ClientEvents, Awaitable } from "discord.js/typings";

export interface BelCommand {
  name: string
  builder: SlashCommandBuilder
  run: (interaction: ChatInputCommandInteraction) => any
}

export interface BelListener {
  name: string
  run: (...args: any) => any
}

export interface BelConfig {
  commandsPath?: string;
  listenersPath?: string;
  intents?: GatewayIntentBits[]
  clientId: string
}

export interface BelClient {
  commands: Map<string, BelCommand>
  listeners: Map<string, BelListener>
}

const loadCommands = (token: string, client_id: string, cmd_path: string, client: Client) => {
  const commandMap = new Map<string, BelCommand>
  const commandFiles = fs.readdirSync(cmd_path).filter(file => file.endsWith(".js"))

  for (const file of commandFiles) {
    const importedFile = require(path.join(cmd_path, file))
    const command: BelCommand = importedFile.default

    if (!command) throw new Error("File does not export default")

    commandMap.set(command.name, command)
  }

  const commandBuilders = Array.from(commandMap.values()).map((cmd) => cmd.builder.toJSON())
  const rest = new REST({ version: '9' }).setToken(token);

  (async () => {
    try {
      console.log("Refreshing application (/) commands...")

      await rest.put(
        Routes.applicationCommands(client_id), {
        body: commandBuilders
      })

      console.log(`Refreshed ${commandMap.size} application (/) commands successfully`)
    } catch (err) {
      console.error(err)
    }
  })()

  client.on("interactionCreate", (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction

    const cmd = commandMap.get(commandName)

    if (cmd) {
      cmd.run(interaction)
    }
  })

  return commandMap
}

const loadListeners = (listener_path: string, client: Client) => {
  const listenerMap = new Map<string, BelListener>
  const listenerFiles = fs.readdirSync(listener_path).filter(file => file.endsWith(".js"))

  for (const file of listenerFiles) {
    const importedFile = require(path.join(listener_path, file))
    const listener: BelListener = importedFile.default

    if (!listener) throw new Error("File does not export default")

    listenerMap.set(listener.name, listener)
  }

  listenerMap.forEach(listener => {
    client.on(listener.name, (...args) => listener.run(...args))
  })

  return listenerMap
}

export const createBelClient = (token: string, config: BelConfig): BelClient => {
  const client = new Client({
    intents: [...(config.intents ?? []), GatewayIntentBits.Guilds]
  })

  const commandMap = config.commandsPath ? loadCommands(token, config.clientId, config.commandsPath, client) : new Map<string, BelCommand>()
  const listenerMap = config.listenersPath ? loadListeners(config.listenersPath, client) : new Map<string, BelListener>()

  return { ...client, commands: commandMap, listeners: listenerMap }
};

export const createBelListener = <K extends keyof ClientEvents>(name: K, run: (...args: ClientEvents[K]) => Awaitable<void>): BelListener => {
  return {
    name,
    run
  }
}

export const createBelCommand = (name: string, run: (interaction: ChatInputCommandInteraction) => any) => {
  return {
    name,
    run
  }
}