import {
    REST,
    Routes
} from "discord.js";

import {
    allCommands
} from "./commands/commands.js";

import {
    config
} from "./config.js";

const rest =
    new REST({
        version: "10"
    }).setToken(
        config.token
    );

console.log(
    "Registering COD:M AIM DRILLS commands..."
);

try {

    await rest.put(
        Routes.applicationGuildCommands(
            config.clientId,
            config.guildId
        ),
        {
            body:
                allCommands.map(
                    command =>
                        command.toJSON()
                )
        }
    );

    console.log(
        `Successfully registered ${allCommands.length} commands.`
    );

} catch (error) {

    console.error(
        "Command registration failed:",
        error
    );
}