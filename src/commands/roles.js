import {
    EmbedBuilder
} from "discord.js";

import {
    getUser
} from "../services/drillService.js";


export async function showRoles(
    interaction
) {

    const user =
        getUser(
            interaction.user.id
        );

    if (
        !user ||
        !user.primary_role ||
        !user.secondary_role
    ) {

        await interaction.reply({
            content:
                "❌ YOU HAVE NOT REGISTERED YOUR GUN ROLES YET.\n\n" +
                "Use `/setup-roles` first."
        });

        return;
    }

    const embed =
        new EmbedBuilder()
            .setTitle(
                `🎯 ${interaction.user.username.toUpperCase()}'S GUN ROLES`
            )
            .setDescription(
                `**PRIMARY GUN ROLE**\n` +
                `🎯 ${user.primary_role}\n\n` +

                `**SECONDARY GUN ROLE**\n` +
                `🔫 ${user.secondary_role}\n\n` +

                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `U HAVE SELECTED **${user.primary_role}** ` +
                `AS YOUR PRIMARY GUN ROLE AND ` +
                `**${user.secondary_role}** ` +
                `AS YOUR SECONDARY GUN ROLE.\n\n` +

                `A FUTURE PRO IS IN THE MAKING. 🔥\n` +
                `ALL THE BEST AND KEEP GRINDING!`
            );

    await interaction.reply({
        embeds: [embed]
    });
}