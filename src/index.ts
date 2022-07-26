import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Routes, GatewayIntentBits, ChatInputCommandInteraction, ClientEvents, ClientOptions } from "discord.js";
import fs from "fs"
import path from "path";

export type BelCommandRunMethod = (interaction: ChatInputCommandInteraction) => any

export interface BelListener<T extends keyof ClientEvents> {
  name: T
  once?: boolean,
  run(...args: ClientEvents[T]): any
}

export const createBelListener = <T extends keyof ClientEvents>(listener: BelListener<T>) => listener

export interface BelCommand {
  builder: SlashCommandBuilder
  run: BelCommandRunMethod
}

export interface BelConfig {
  commandsPath?: string;
  listenersPath?: string;
  clientId: string
  token: string
}

export class BelClient extends Client {
  public commandMap = new Map<string, BelCommandRunMethod>()
  public listenerMap = new Map<string, BelListener<keyof ClientEvents>["run"]>()

  constructor(options: ClientOptions & BelConfig) {
    super(options)
    this.init(options.token, options)
  }

  init(token: string, options: BelConfig): void {
    options.commandsPath && this.loadCommands(options.token, options.clientId, options.commandsPath!, this)
    options.listenersPath && this.loadListeners(options.listenersPath!, this)
  }

  loadCommands(token: string, client_id: string, cmd_path: string, client: Client): void {
    const commandFiles = fs.readdirSync(cmd_path).filter(file => file.endsWith(".js"))
    const commandBuilders = [];

    for (const file of commandFiles) {
      const importedFile = require(path.join(cmd_path, file))
      const { builder, run }: BelCommand = importedFile

      if (!builder || !run) throw new Error("Command files need to export builder object & run method")

      commandBuilders.push(builder)
      this.commandMap.set(builder.name, run)
    }

    const rest = new REST({ version: '9' }).setToken(token);

    (async () => {
      try {
        console.log("Refreshing application (/) commands...")

        await rest.put(
          Routes.applicationCommands(client_id), {
          body: commandBuilders
        })

        console.log(`Refreshed ${this.commandMap.size} application (/) commands successfully`)
      } catch (err) {
        console.error(err)
      }
    })()

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand() || !interaction.isContextMenuCommand()) return;

      const { commandName } = interaction

      const runCommand = this.commandMap.get(commandName)

      if (runCommand) {
        try {
          await runCommand(interaction)
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  loadListeners(listener_path: string, client: Client): void {
    const listenerFiles = fs.readdirSync(listener_path).filter(file => file.endsWith(".js"))

    for (const file of listenerFiles) {
      const { name, once, run }: BelListener<keyof ClientEvents> = require(path.join(listener_path, file)).default

      const event = name ?? file.slice(0, -3)

      if (once) {
        client.once(event, run)
      } else {
        client.on(event, run)
      }

      this.listenerMap.set(event, run)
    }
  }
}