"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBelClient = void 0;
const rest_1 = require("@discordjs/rest");
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loadCommands = (token, client_id, cmd_path) => {
    const commandMap = new Map;
    const commandFiles = fs_1.default.readdirSync(cmd_path).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const importedFile = require(path_1.default.join(cmd_path, file));
        const command = importedFile.default;
        if (!command)
            throw new Error("File does not export default");
        commandMap.set(command.name, command);
    }
    const commandBuilders = Array.from(commandMap.values()).map((cmd) => cmd.builder.toJSON());
    const rest = new rest_1.REST({ version: '9' }).setToken(token);
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log("Refreshing application (/) commands...");
            yield rest.put(discord_js_1.Routes.applicationCommands(client_id), {
                body: commandBuilders
            });
            console.log(`Refreshed ${commandMap.size} application (/) commands successfully`);
        }
        catch (err) {
            console.error(err);
        }
    }))();
    return commandMap;
};
const loadListeners = (listener_path, client) => {
    const listenerMap = new Map;
    const listenerFiles = fs_1.default.readdirSync(listener_path).filter(file => file.endsWith(".js"));
    for (const file of listenerFiles) {
        const importedFile = require(path_1.default.join(listener_path, file));
        const listener = importedFile.default;
        if (!listener)
            throw new Error("File does not export default");
        listenerMap.set(listener.name, listener);
    }
    listenerMap.forEach(listener => {
        client.on(listener.name, (...args) => listener.run(...args));
    });
    return listenerMap;
};
const createBelClient = (token, config) => {
    var _a;
    const client = new discord_js_1.Client({
        intents: [...((_a = config.intents) !== null && _a !== void 0 ? _a : []), discord_js_1.GatewayIntentBits.Guilds]
    });
    const commandMap = config.commandsPath ? loadCommands(token, config.clientId, config.commandsPath) : new Map();
    const listenerMap = config.listenersPath ? loadListeners(config.listenersPath, client) : new Map();
    return {
        client,
        commands: commandMap,
        listeners: listenerMap
    };
};
exports.createBelClient = createBelClient;
