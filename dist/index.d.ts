import { SlashCommandBuilder } from "@discordjs/builders";
import { GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import { ClientEvents, Awaitable } from "discord.js/typings";
export interface BelCommand {
    name: string;
    builder: SlashCommandBuilder;
    run: (interaction: ChatInputCommandInteraction) => any;
}
export interface BelListener {
    name: string;
    run: (...args: any) => any;
}
export interface BelConfig {
    commandsPath?: string;
    listenersPath?: string;
    intents?: GatewayIntentBits[];
    clientId: string;
}
export interface BelClient {
    commands: Map<string, BelCommand>;
    listeners: Map<string, BelListener>;
}
export declare const createBelClient: (token: string, config: BelConfig) => BelClient;
export declare const createBelListener: <K extends keyof ClientEvents>(name: K, run: (...args: ClientEvents[K]) => Awaitable<void>) => BelListener;
export declare const createBelCommand: (name: string, run: (interaction: ChatInputCommandInteraction) => any) => {
    name: string;
    run: (interaction: ChatInputCommandInteraction) => any;
};
