import {
    EmbedBuilder
} from "discord.js";

import {
    getDailyProgress
} from "../services/drillService.js";

import {
    getDailyCycle
} from "../utils/dailyCycle.js";

import {
    getStreak
} from "../services/streakService.js";


export async function showToday(
    interaction
) {

    const day =
        getDailyCycle();

    const progress =
        getDailyProgress(
            interaction.user.id,
            day
        );

    const streak =
        getStreak(
            interaction.user.id
        );

    const primary =
        progress.primary_count;

    const secondary =
        progress.secondary_count;

    const total =
        progress.total_count;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🎯 TODAY'S AIM DRILLS"
            )
            .setDescription(
                `Daily Cycle: **03:00 AM IST → 03:00 AM IST**\n\n` +

                `🎯 **PRIMARY:** ${primary}/2\n` +
                `🔫 **SECONDARY:** ${secondary}/2\n\n` +

                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `🔥 **TOTAL:** ${total}/4\n\n` +

                `🔥 **CURRENT STREAK:** ${streak.current} DAYS\n` +
                `🏆 **LONGEST STREAK:** ${streak.longest} DAYS\n\n` +

                (
                    progress.completed
                        ? "✅ **TODAY COMPLETED — 4/4**"
                        : "⏳ Complete all 4 approved drills to complete today."
                )
            );

    await interaction.reply({
        embeds: [embed]
    });
}