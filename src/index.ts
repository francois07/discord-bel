import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Routes, GatewayIntentBits, ChatInputCommandInteraction, ClientEvents } from "discord.js";
import fs from "fs"
import path from "path";

export type BelCommandRunMethod = (interaction: ChatInputCommandInteraction) => any

export interface BelListener<T extends keyof ClientEvents> {
  name: T
  once?: boolean,
  run(...args: ClientEvents[T]): any
}

const createListener = <T extends keyof ClientEvents>(listener: BelListener<T>) => listener

export interface BelCommand {
  builder: SlashCommandBuilder
  run: BelCommandRunMethod
}

export interface BelConfig {
  commandsPath?: string;
  listenersPath?: string;
  intents?: GatewayIntentBits[]
  clientId: string
}

export interface BelClient {
  commands: Map<string, BelCommandRunMethod>
  listeners: Map<string, BelListener<keyof ClientEvents>["run"]>
}

const loadCommands = (token: string, client_id: string, cmd_path: string, client: Client) => {
  const commandMap = new Map<string, BelCommandRunMethod>
  const commandFiles = fs.readdirSync(cmd_path).filter(file => file.endsWith(".js"))
  const commandBuilders = [];

  for (const file of commandFiles) {
    const importedFile = require(path.join(cmd_path, file))
    const { builder, run }: BelCommand = importedFile

    if (!builder || !run) throw new Error("Command files need to export builder object & run method")

    commandBuilders.push(builder)
    commandMap.set(builder.name, run)
  }

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

    const runCommand = commandMap.get(commandName)

    if (runCommand) {
      runCommand(interaction)
    }
  })

  return commandMap
}

const loadListeners = (listener_path: string, client: Client) => {
  const listenerMap = new Map<string, BelListener<keyof ClientEvents>["run"]>
  const listenerFiles = fs.readdirSync(listener_path).filter(file => file.endsWith(".js"))

  for (const file of listenerFiles) {
    const { name, once, run }: BelListener<keyof ClientEvents> = require(path.join(listener_path, file))

    const event = name ?? file.slice(0, -3)

    if (once) {
      client.once(event, run)
    } else {
      client.on(event, run)
    }

    listenerMap.set(event, run)
  }

  return listenerMap
}

export const createBelClient = (token: string, config: BelConfig): BelClient => {
  const client = new Client({
    intents: [...(config.intents ?? []), GatewayIntentBits.Guilds]
  })

  const commandMap = config.commandsPath ? loadCommands(token, config.clientId, config.commandsPath, client) : new Map<string, BelCommandRunMethod>()
  const listenerMap = config.listenersPath ? loadListeners(config.listenersPath, client) : new Map<string, BelListener<keyof ClientEvents>["run"]>()

  return { ...client, commands: commandMap, listeners: listenerMap }
};