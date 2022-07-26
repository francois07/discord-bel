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
exports.BelClient = exports.createBelListener = void 0;
const rest_1 = require("@discordjs/rest");
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createBelListener = (listener) => listener;
exports.createBelListener = createBelListener;
class BelClient extends discord_js_1.Client {
    constructor(options) {
        super(options);
        this.commandMap = new Map();
        this.listenerMap = new Map();
        this.init(options.token, options);
    }
    init(token, options) {
        options.commandsPath && this.loadCommands(options.token, options.clientId, options.commandsPath, this);
        options.listenersPath && this.loadListeners(options.listenersPath, this);
    }
    loadCommands(token, client_id, cmd_path, client) {
        const commandFiles = fs_1.default.readdirSync(cmd_path).filter(file => file.endsWith(".js"));
        const commandBuilders = [];
        for (const file of commandFiles) {
            const importedFile = require(path_1.default.join(cmd_path, file));
            const { builder, run } = importedFile;
            if (!builder || !run)
                throw new Error("Command files need to export builder object & run method");
            commandBuilders.push(builder);
            this.commandMap.set(builder.name, run);
        }
        const rest = new rest_1.REST({ version: '9' }).setToken(token);
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Refreshing application (/) commands...");
                yield rest.put(discord_js_1.Routes.applicationCommands(client_id), {
                    body: commandBuilders
                });
                console.log(`Refreshed ${this.commandMap.size} application (/) commands successfully`);
            }
            catch (err) {
                console.error(err);
            }
        }))();
        client.on("interactionCreate", (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isChatInputCommand() || !interaction.isContextMenuCommand())
                return;
            const { commandName } = interaction;
            const runCommand = this.commandMap.get(commandName);
            if (runCommand) {
                try {
                    yield runCommand(interaction);
                }
                catch (err) {
                    console.error(err);
                }
            }
        }));
    }
    loadListeners(listener_path, client) {
        const listenerFiles = fs_1.default.readdirSync(listener_path).filter(file => file.endsWith(".js"));
        for (const file of listenerFiles) {
            const { name, once, run } = require(path_1.default.join(listener_path, file)).default;
            const event = name !== null && name !== void 0 ? name : file.slice(0, -3);
            if (once) {
                client.once(event, run);
            }
            else {
                client.on(event, run);
            }
            this.listenerMap.set(event, run);
        }
    }
}
exports.BelClient = BelClient;
