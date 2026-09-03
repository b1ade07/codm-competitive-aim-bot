import { EmbedBuilder } from "discord.js";
import { getStreak } from "../services/streakService.js";

export async function showStreak(interaction) {
    const streak = getStreak(interaction.user.id);

    const embed = new EmbedBuilder()
        .setTitle(
            `🔥 ${interaction.user.username.toUpperCase()}'S AIM DRILL STREAK`
        )
        .setDescription(
            `🔥 **CURRENT STREAK**\n` +
            `${streak.current} DAY${streak.current === 1 ? "" : "S"}\n\n` +
            `🏆 **LONGEST STREAK**\n` +
            `${streak.longest} DAY${streak.longest === 1 ? "" : "S"}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `A day counts only when **ALL 4 DRILLS ARE APPROVED**.\n\n` +
            `🎯 Primary: 2/2\n` +
            `🔫 Secondary: 2/2\n` +
            `🔥 Total: 4/4\n\n` +
            `MISS EVEN ONE DRILL → STREAK LOST.`
        );

    await interaction.reply({
        embeds: [embed]
    });
}