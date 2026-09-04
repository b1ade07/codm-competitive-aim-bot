import {
    EmbedBuilder
} from "discord.js";

import {
    getUser
} from "../services/drillService.js";


export async function showRoles(
    interaction
) {

    try {

        const user =
            getUser(
                interaction.user.id
            );


        if (
            !user ||
            !user.primary_role ||
            !user.secondary_role
        ) {

            return await interaction.reply({
                content:
                    "?? **NO GUN ROLES ARE REGISTERED FOR YOU YET.**\n\n" +
                    "Use `/setup-roles` to register your Primary and Secondary gun roles."
            });

        }


        const embed =
            new EmbedBuilder()
                .setTitle("?? YOUR REGISTERED GUN ROLES")
                .setDescription(
                    `?? **Player:** ${interaction.user}\n\n` +
                    `?? **PRIMARY:** ${user.primary_role}\n` +
                    `?? **SECONDARY:** ${user.secondary_role}\n\n` +
                    "?? **THESE ROLES ARE PERMANENT AND CANNOT BE CHANGED.**\n\n" +
                    "A FUTURE PRO IS IN THE MAKING. ??\n" +
                    "ALL THE BEST AND KEEP GRINDING!"
                );


        return await interaction.reply({
            embeds: [
                embed
            ]
        });


    } catch (error) {

        console.error(
            "ROLES COMMAND ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({
                content:
                    "? **COULD NOT LOAD YOUR REGISTERED GUN ROLES.**"
            });

        }

    }

}
