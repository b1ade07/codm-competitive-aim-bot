import { PermissionFlagsBits } from "discord.js";
import { deleteApprovedDrill } from "../services/drillService.js";

export async function handleDeleteUploadedData(interaction) {

    const drillId =
        interaction.options.getInteger("drill_id");

    const result =
        deleteApprovedDrill(
            interaction.user.id,
            drillId
        );

    if (!result.success) {

        if (result.reason === "INVALID_DRILL_ID") {

            return interaction.reply({
                content: "❌ Please provide a valid Drill ID.",
                ephemeral: true
            });

        }

        if (result.reason === "NOT_FOUND") {

            return interaction.reply({
                content: `❌ Drill ID **${drillId}** was not found.`,
                ephemeral: true
            });

        }

        if (result.reason === "NOT_OWNER") {

            return interaction.reply({
                content: "❌ You can delete only your own drill.",
                ephemeral: true
            });

        }

        if (result.reason === "NOT_APPROVED") {

            return interaction.reply({
                content: "❌ Only an APPROVED drill can be deleted.",
                ephemeral: true
            });

        }

        return interaction.reply({
            content: "❌ The drill could not be deleted. No data was changed.",
            ephemeral: true
        });

    }


    // --------------------------------------------------------
    // DELETE PUBLIC DISCORD MESSAGE
    // --------------------------------------------------------

    let messageDeleted = false;

    try {

        const channelId =
            result.drill.screenshot_channel_id;

        const messageId =
            result.drill.screenshot_message_id;

        if (
            channelId &&
            messageId
        ) {

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


    const progress =
        result.progress;

    const streak =
        result.streak;


    return interaction.reply({
        content:
            `✅ **Drill ID ${drillId} deleted successfully.**\n\n` +
            `📊 Today's progress: **${progress.total}/4** ` +
            `(Primary ${progress.primary}/2, Secondary ${progress.secondary}/2)\n` +
            `${progress.completed ? "🏆 4/4 completion remains." : "⚠️ 4/4 completion is no longer achieved today."}\n` +
            `🔥 Current streak: **${streak.current} day(s)**\n` +
            `🏅 Longest streak: **${streak.longest} day(s)**\n` +
            `${messageDeleted ? "🗑️ The public drill result was also removed." : "ℹ️ The database drill was deleted; the public Discord result was already unavailable."}`,
        ephemeral: true
    });

}
