import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
interface IBelCommand {
    name: string;
    builder: SlashCommandBuilder;
    run: (interaction: ChatInputCommandInteraction) => any;
}
interface IBelListener {
    name: string;
    run: (...args: any[]) => any;
}
interface IBelConfig {
    commandsPath?: string;
    listenersPath?: string;
    intents?: GatewayIntentBits[];
    clientId: string;
}
interface IBelClient {
    client: Client;
    commands: Map<string, IBelCommand>;
    listeners: Map<string, IBelListener>;
}
export declare const createBelClient: (token: string, config: IBelConfig) => IBelClient;
export {};
