require("dotenv").config()
import { BelClient } from "../index"
import { GatewayIntentBits } from "discord.js";
import path from "path";

const { DISCORD_TOKEN } = process.env

const client = new BelClient(DISCORD_TOKEN!, {
  intents: [GatewayIntentBits.Guilds],
  commandsPath: ["commands", "contexts"].map(d => path.join(__dirname, d))
})