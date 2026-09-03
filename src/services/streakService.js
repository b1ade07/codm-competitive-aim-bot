import db from "../database/database.js";


export function getStreak(discordId) {

    const user =
        db.prepare(`
            SELECT
                current_streak,
                longest_streak,
                last_completed_day
            FROM users
            WHERE discord_id = ?
        `).get(discordId);

    if (!user) {

        return {
            current: 0,
            longest: 0,
            lastCompletedDay: null
        };
    }

    return {
        current:
            user.current_streak || 0,

        longest:
            user.longest_streak || 0,

        lastCompletedDay:
            user.last_completed_day
    };
}


export function updateStreak(
    discordId,
    dayKey
) {

    const user =
        db.prepare(`
            SELECT
                current_streak,
                longest_streak,
                last_completed_day
            FROM users
            WHERE discord_id = ?
        `).get(discordId);

    if (!user) {
        return;
    }

    if (
        user.last_completed_day === dayKey
    ) {
        return;
    }

    let newStreak = 1;

    if (user.last_completed_day) {

        const previous =
            new Date(
                `${user.last_completed_day}T03:00:00+05:30`
            );

        const current =
            new Date(
                `${dayKey}T03:00:00+05:30`
            );

        const difference =
            Math.round(
                (
                    current - previous
                ) /
                (1000 * 60 * 60 * 24)
            );

        if (difference === 1) {
            newStreak =
                (user.current_streak || 0) + 1;
        }
    }

    const longest =
        Math.max(
            newStreak,
            user.longest_streak || 0
        );

    db.prepare(`
        UPDATE users
        SET
            current_streak = ?,
            longest_streak = ?,
            last_completed_day = ?
        WHERE discord_id = ?
    `).run(
        newStreak,
        longest,
        dayKey,
        discordId
    );
}


export function breakStreakIfNeeded(
    discordId,
    currentDay
) {

    const user =
        db.prepare(`
            SELECT
                current_streak,
                last_completed_day
            FROM users
            WHERE discord_id = ?
        `).get(discordId);

    if (!user) {
        return;
    }

    if (!user.last_completed_day) {
        return;
    }

    const last =
        new Date(
            `${user.last_completed_day}T03:00:00+05:30`
        );

    const current =
        new Date(
            `${currentDay}T03:00:00+05:30`
        );

    const days =
        Math.round(
            (current - last) /
            (1000 * 60 * 60 * 24)
        );

    if (days > 1) {

        db.prepare(`
            UPDATE users
            SET current_streak = 0
            WHERE discord_id = ?
        `).run(discordId);
    }
}