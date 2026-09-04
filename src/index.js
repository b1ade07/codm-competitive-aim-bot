import "dotenv/config";

import {
    Client,
    GatewayIntentBits
} from "discord.js";

import { config } from "./config.js";
import "./database/database.js";

import { handleInteraction } from "./interactions/handlers.js";
import { startRetentionCleanup } from "./services/retentionService.js";


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});


client.once("ready", () => {

    console.log("");
    console.log("======================================");
    console.log("       COD:M AIM DRILLS BOT");
    console.log("======================================");

    console.log(
        `Bot: ${client.user.tag}`
    );

    console.log(
        `Bot ID: ${client.user.id}`
    );

    console.log(
        `Guild: ${config.guildId}`
    );

    console.log(
        `AIM DRILLS Channel: ${config.aimDrillsChannelId}`
    );

    console.log("Database: ONLINE");
    console.log("Discord: ONLINE");
    startRetentionCleanup(client);

    console.log("Status: ONLINE");

    console.log("======================================");
    console.log("");

});


client.on(
    "interactionCreate",
    async interaction => {

        try {

            await handleInteraction(
                interaction
            );

        } catch (error) {

            console.error(
                "Interaction Error:",
                error
            );

        }

    }
);


client.on(
    "error",
    error => {

        console.error(
            "Discord Client Error:",
            error
        );

    }
);


process.on(
    "unhandledRejection",
    error => {

        console.error(
            "Unhandled Promise Rejection:",
            error
        );

    }
);


process.on(
    "uncaughtException",
    error => {

        console.error(
            "Uncaught Exception:",
            error
        );

    }
);


client.login(
    config.token
);