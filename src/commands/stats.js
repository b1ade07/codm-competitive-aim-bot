import {
    EmbedBuilder
} from "discord.js";

import {
    getLifetimeStats
} from "../services/statsService.js";

import {
    getStreak
} from "../services/streakService.js";


export async function showStats(
    interaction
) {

    const stats =
        getLifetimeStats(
            interaction.user.id
        );

    const streak =
        getStreak(
            interaction.user.id
        );

    const embed =
        new EmbedBuilder()
            .setTitle(
                `📊 ${interaction.user.username.toUpperCase()}'S LIFETIME STATS`
            )
            .setDescription(
                `**APPROVED DRILLS**\n` +
                `${stats.total}\n\n` +

                `🎯 **AVERAGE KILLS**\n` +
                `${stats.avgKills.toFixed(2)}\n\n` +

                `📈 **AVERAGE ACCURACY**\n` +
                `${stats.avgAccuracy.toFixed(2)}%\n\n` +

                `🎯 **AVERAGE HEADSHOT ACCURACY**\n` +
                `${stats.avgHeadshotAccuracy.toFixed(2)}%\n\n` +

                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `🔥 **CURRENT STREAK:** ${streak.current}\n` +
                `🏆 **LONGEST STREAK:** ${streak.longest}`
            );

    await interaction.reply({
        embeds: [embed]
    });
}