import { EmbedBuilder } from "discord.js";
import db from "../database/database.js";

function getCurrentYear() {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Kolkata",
            year: "numeric"
        }
    ).format(new Date());
}

export async function handlePeakDrill(interaction) {

    const year = getCurrentYear();

    const yearStart =
        `${year}-01-01T00:00:00`;

    const nextYearStart =
        `${Number(year) + 1}-01-01T00:00:00`;

    const peak = db.prepare(`
        SELECT
            MAX(kills) AS peak_kills,
            MAX(accuracy) AS peak_accuracy,
            MAX(headshot_accuracy) AS peak_headshot_accuracy
        FROM drills
        WHERE discord_id = ?
          AND status = 'APPROVED'
          AND submitted_at >= ?
          AND submitted_at < ?
    `).get(
        interaction.user.id,
        yearStart,
        nextYearStart
    );

    if (
        !peak ||
        (
            peak.peak_kills === null &&
            peak.peak_accuracy === null &&
            peak.peak_headshot_accuracy === null
        )
    ) {
        return await interaction.reply({
            content:
                `\U0001F4CA **${year} PEAK DRILL**\n\n` +
                "No approved drills found for the current year.",
            ephemeral: true
        });
    }

    const embed =
        new EmbedBuilder()
            .setTitle(
                `\U0001F3C6 ${year} PEAK DRILL`
            )
            .setDescription(
                `Your highest approved drill achievements for **${year}**.`
            )
            .addFields(
                {
                    name: "\U0001F480 PEAK KILLS",
                    value:
                        `${Number(peak.peak_kills || 0).toFixed(0)}`,
                    inline: true
                },
                {
                    name: "\U0001F3AF PEAK ACCURACY",
                    value:
                        `${Number(peak.peak_accuracy || 0).toFixed(2)}%`,
                    inline: true
                },
                {
                    name: "\U0001F4A5 PEAK HEADSHOT ACCURACY",
                    value:
                        `${Number(peak.peak_headshot_accuracy || 0).toFixed(2)}%`,
                    inline: true
                }
            )
            .setFooter({
                text:
                    `Approved drills • ${year} calendar year`
            });

    return await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}