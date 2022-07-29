import { REST } from "@discordjs/rest";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { Client, Routes, ClientEvents, ClientOptions } from "discord.js";
import fs from "fs"
import path from "path";

export type BelCommandRunMethod = (interaction: any) => any

export interface BelListener<T extends keyof ClientEvents> {
  name: T
  once?: boolean,
  run(...args: ClientEvents[T]): any
}

export const createBelListener = <T extends keyof ClientEvents>(listener: BelListener<T>) => listener

export interface BelCommand {
  builder: SlashCommandBuilder | ContextMenuCommandBuilder
  run: BelCommandRunMethod
}

export interface BelConfig {
  commandsPath?: string | string[];
  listenersPath?: string;
}

export class BelClient extends Client {
  public commandMap = new Map<string, BelCommandRunMethod>()
  public listenerMap = new Map<string, BelListener<keyof ClientEvents>["run"]>()
  public config: BelConfig

  constructor(token: string, options: ClientOptions & BelConfig) {
    super(options)
    this.config = options
    this.login(token)

    this.once("ready", (client: Client) => {
      this.init(token, client.user!.id)
    })
  }

  init(token: string, client_id: string, options: BelConfig = this.config): void {
    options.commandsPath && this.loadCommands(token, client_id, ([] as string[]).concat(options.commandsPath))
    options.listenersPath && this.loadListeners(options.listenersPath!)
  }

  private findFileExport(path: string) {
    const importedFile = require(path)
    if (importedFile.default) return importedFile.default
    return importedFile
  }

  loadCommands(token: string, client_id: string, cmd_path: string[], client: Client = this): void {
    const commandFiles = cmd_path.map(d => {
      const files = fs.readdirSync(d).filter(file => file.endsWith(".js"))
      return files.map(f => path.join(d, f))
    }).flat()

    const commandBuilders = [];

    for (const file of commandFiles) {
      const importedFile = this.findFileExport(file)
      const { builder, run }: BelCommand = importedFile

      if (!builder || !run) throw new Error(`Command file \"${file}\" needs to export builder object & run method`)

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
      if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

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

  loadListeners(listener_path: string, client: Client = this): void {
    const listenerFiles = fs.readdirSync(listener_path).filter(file => file.endsWith(".js"))

    for (const file of listenerFiles) {
      const { name, once, run }: BelListener<keyof ClientEvents> = this.findFileExport(path.join(listener_path, file))

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