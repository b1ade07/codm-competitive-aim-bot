import "dotenv/config";

const required = [
    "DISCORD_TOKEN",
    "CLIENT_ID",
    "GUILD_ID",
    "AIM_DRILLS_CHANNEL_ID"
];

for (const variable of required) {
    if (!process.env[variable]) {
        throw new Error(
            `Missing ${variable} in .env`
        );
    }
}

export const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    aimDrillsChannelId: process.env.AIM_DRILLS_CHANNEL_ID
};