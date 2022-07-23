import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import { ClientEvents, Awaitable } from "discord.js/typings";
export interface IBelCommand {
    name: string;
    builder: SlashCommandBuilder;
    run: (interaction: ChatInputCommandInteraction) => any;
}
export interface IBelListener<T extends keyof ClientEvents> {
    name: keyof ClientEvents;
    run: (...args: ClientEvents[T]) => Awaitable<void>;
}
export interface IBelConfig {
    commandsPath?: string;
    listenersPath?: string;
    intents?: GatewayIntentBits[];
    clientId: string;
}
export interface IBelClient {
    client: Client;
    commands: Map<string, IBelCommand>;
    listeners: Map<string, IBelListener<any>>;
}
export declare const createBelClient: (token: string, config: IBelConfig) => IBelClient;
