import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Routes, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import fs from "fs"
import path from "path";
import { ClientEvents, Awaitable } from "discord.js/typings";

export interface IBelCommand {
  name: string
  builder: SlashCommandBuilder
  run: (interaction: ChatInputCommandInteraction) => any
}

export interface IBelListener<T extends keyof ClientEvents> {
  name: keyof ClientEvents
  run: (...args: ClientEvents[T]) => Awaitable<void>
}

export interface IBelConfig {
  commandsPath?: string;
  listenersPath?: string;
  intents?: GatewayIntentBits[]
  clientId: string
}

export interface IBelClient {
  client: Client
  commands: Map<string, IBelCommand>
  listeners:  Map<string, IBelListener<any>>
}

const loadCommands = (token: string, client_id: string, cmd_path: string) => {
  const commandMap = new Map<string, IBelCommand>
  const commandFiles = fs.readdirSync(cmd_path).filter(file => file.endsWith(".js"))

  for (const file of commandFiles){
    const importedFile = require(path.join(cmd_path, file))
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
        Routes.applicationCommands(client_id),
        {
          body: commandBuilders
        }
        )

      console.log(`Refreshed ${commandMap.size} application (/) commands successfully`)
    } catch(err) {
      console.error(err)
    }
  })()

  return commandMap
}

const loadListeners = (listener_path: string, client: Client) => {
  const listenerMap = new Map<string, IBelListener<any>>
  const listenerFiles = fs.readdirSync(listener_path).filter(file => file.endsWith(".js"))

  for (const file of listenerFiles){
    const importedFile = require(path.join(listener_path, file))
    const listener: IBelListener<any> = importedFile.default

    if(!listener) throw new Error("File does not export default")

    listenerMap.set(listener.name, listener)
  }

  listenerMap.forEach(listener => {
    client.on(listener.name, (...args) => listener.run(...args))
  })

  return listenerMap
}

export const createBelClient = (token: string, config: IBelConfig): IBelClient => {
  const client = new Client({
    intents: [...(config.intents ?? []), GatewayIntentBits.Guilds]
  })
  
  const commandMap = config.commandsPath ? loadCommands(token, config.clientId, config.commandsPath) : new Map<string, IBelCommand>()
  const listenerMap = config.listenersPath ? loadListeners(config.listenersPath, client) : new Map<string, IBelListener<any>>()

  return {
    client,
    commands: commandMap,
    listeners: listenerMap
  }
};
