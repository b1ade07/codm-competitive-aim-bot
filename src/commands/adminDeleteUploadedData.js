import { PermissionFlagsBits } from "discord.js";
import {
    deleteApprovedDrill,
    getDrill
} from "../services/drillService.js";

export async function handleAdminDeleteUploadedData(interaction) {

    if (
        !interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return interaction.reply({
            content: "? Administrator permission required.",
            ephemeral: true
        });
    }

    const drillId =
        interaction.options.getInteger("drill_id");

    const drill =
        getDrill(drillId);

    if (!drill) {
        return interaction.reply({
            content: `? Drill ID **${drillId}** was not found.`,
            ephemeral: true
        });
    }

    const result =
        deleteApprovedDrill(
            drill.discord_id,
            drillId
        );

    if (!result.success) {

        if (result.reason === "NOT_APPROVED") {
            return interaction.reply({
                content: "? Only an APPROVED drill can be deleted.",
                ephemeral: true
            });
        }

        return interaction.reply({
            content: "? The drill could not be deleted. No data was changed.",
            ephemeral: true
        });
    }

    let messageDeleted = false;

    try {

        const channelId =
            result.drill.screenshot_channel_id;

        const messageId =
            result.drill.screenshot_message_id;

        if (channelId && messageId) {

            const channel =
                await interaction.client.channels.fetch(
                    channelId
                );

            if (
                channel &&
                channel.isTextBased()
            ) {

                const message =
                    await channel.messages.fetch(
                        messageId
                    );

                await message.delete();

                messageDeleted = true;
            }
        }

    } catch (error) {

        console.log(
            "Public drill message was already missing or could not be deleted:",
            error?.message || error
        );
    }

    return interaction.reply({
        content:
            `? **Drill ID ${drillId} deleted by admin.**\n\n` +
            `User: <@${drill.discord_id}>\n` +
            `?? Progress: **${result.progress.total}/4**\n` +
            `?? Current streak: **${result.streak.current} day(s)**\n` +
            `?? Longest streak: **${result.streak.longest} day(s)**\n` +
            `${messageDeleted
                ? "??? Public drill result removed."
                : "?? Database drill deleted; public result unavailable."}`,
        ephemeral: true
    });
}