import { EmbedBuilder } from "discord.js";
import { getUser } from "../services/drillService.js";

export async function showRoles(interaction) {
    try {
        const user = getUser(interaction.user.id);

        if (!user || !user.primary_role || !user.secondary_role) {
            return await interaction.reply({
                content:
                    "\u{1F3AF} **NO GUN ROLES ARE REGISTERED FOR YOU YET.**\n\n" +
                    "Use `/setup-roles` to register your Primary and Secondary gun roles."
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("\u{1F3AF} YOUR REGISTERED GUN ROLES")
            .setDescription(
                `\u{1F464} **Player:** ${interaction.user}\n\n` +
                `\u{1F3AF} **PRIMARY:** ${user.primary_role}\n` +
                `\u{1F52B} **SECONDARY:** ${user.secondary_role}\n\n` +
                "\u{1F512} **THESE ROLES ARE PERMANENT AND CANNOT BE CHANGED.**\n\n" +
                "A FUTURE PRO IS IN THE MAKING. \u{1F525}\n" +
                "ALL THE BEST AND KEEP GRINDING!"
            );

        return await interaction.reply({
            embeds: [embed]
        });

    } catch (error) {
        console.error("ROLES COMMAND ERROR:", error);

        if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
                content: "\u{274C} **COULD NOT LOAD YOUR REGISTERED GUN ROLES.**"
            });
        }
    }
}
