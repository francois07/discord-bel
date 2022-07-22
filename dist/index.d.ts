import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
interface IBelCommand {
    name: string;
    builder: SlashCommandBuilder;
    run: (interaction: ChatInputCommandInteraction) => any;
}
interface IBelConfig {
    commandsPath: string;
    intents?: GatewayIntentBits[];
    clientId: string;
}
interface IBelClient {
    client: Client;
    commands: Map<string, IBelCommand>;
}
export declare const createBelClient: (token: string, config: IBelConfig) => IBelClient;
export {};
