import crypto from "crypto";

import db from "../database/database.js";
import { getDailyCycle } from "../utils/dailyCycle.js";
import { updateStreak } from "./streakService.js";


// ============================================================
// USER
// ============================================================

export function getUser(discordId) {

    return db.prepare(`
        SELECT *
        FROM users
        WHERE discord_id = ?
    `).get(discordId);

}


export function createOrUpdateUser(
    discordId,
    username
) {

    const existing =
        getUser(discordId);

    if (!existing) {

        db.prepare(`
            INSERT INTO users (
                discord_id,
                username
            )
            VALUES (?, ?)
        `).run(
            discordId,
            username
        );

        return;
    }

    db.prepare(`
        UPDATE users
        SET username = ?
        WHERE discord_id = ?
    `).run(
        username,
        discordId
    );

}


// ============================================================
// REGISTER ROLES
// ============================================================

export function registerRoles(
    discordId,
    username,
    primary,
    secondary
) {

    createOrUpdateUser(
        discordId,
        username
    );

    const existing =
        getUser(discordId);

    if (
        existing.primary_role ||
        existing.secondary_role
    ) {

        return {
            success: false,
            reason: "ALREADY_REGISTERED"
        };

    }

    db.prepare(`
        UPDATE users
        SET
            primary_role = ?,
            secondary_role = ?,
            registered_at = ?
        WHERE discord_id = ?
    `).run(
        primary,
        secondary,
        new Date().toISOString(),
        discordId
    );

    return {
        success: true
    };

}


// ============================================================
// DAILY PROGRESS
// ============================================================

export function getDailyProgress(
    discordId,
    dayKey = getDailyCycle()
) {

    let progress =
        db.prepare(`
            SELECT *
            FROM daily_progress
            WHERE discord_id = ?
            AND day_key = ?
        `).get(
            discordId,
            dayKey
        );

    if (!progress) {

        db.prepare(`
            INSERT INTO daily_progress (
                discord_id,
                day_key,
                primary_count,
                secondary_count,
                total_count,
                completed
            )
            VALUES (?, ?, 0, 0, 0, 0)
        `).run(
            discordId,
            dayKey
        );

        progress =
            db.prepare(`
                SELECT *
                FROM daily_progress
                WHERE discord_id = ?
                AND day_key = ?
            `).get(
                discordId,
                dayKey
            );

    }

    return progress;

}


// ============================================================
// DAILY SUBMISSION COUNT
// ============================================================
//
// PENDING + APPROVED consume one of the four daily slots.
// REJECTED drills do not consume a slot.
// ============================================================

export function getDailySubmissionCount(
    discordId,
    dayKey = getDailyCycle()
) {

    const result =
        db.prepare(`
            SELECT COUNT(*) AS total
            FROM drills
            WHERE discord_id = ?
            AND day_key = ?
            AND status IN ('PENDING', 'APPROVED')
        `).get(
            discordId,
            dayKey
        );

    return Number(
        result?.total || 0
    );

}


// ============================================================
// CHECK DAILY SUBMISSION LIMIT
// ============================================================

export function canSubmitDailyDrill(
    discordId,
    dayKey = getDailyCycle()
) {

    const count =
        getDailySubmissionCount(
            discordId,
            dayKey
        );

    return {
        allowed: count < 4,
        count,
        limit: 4,
        remaining:
            Math.max(
                0,
                4 - count
            )
    };

}


// ============================================================
// FINGERPRINT
// ============================================================

function makeFingerprint(
    discordId,
    roleType,
    gunRole,
    kills,
    accuracy,
    headshotAccuracy
) {

    const raw = [
        discordId,
        roleType,
        gunRole,
        kills,
        Number(accuracy).toFixed(2),
        Number(headshotAccuracy).toFixed(2)
    ].join("|");

    return crypto
        .createHash("sha256")
        .update(raw)
        .digest("hex");

}


// ============================================================
// SUBMIT DRILL
// ============================================================

export function submitDrill({

    discordId,
    roleType,
    gunRole,
    kills,
    accuracy,
    headshotAccuracy,
    screenshotUrl,
    screenshotMessageId,
    screenshotChannelId

}) {

    const dayKey =
        getDailyCycle();

    const fingerprint =
        makeFingerprint(
            discordId,
            roleType,
            gunRole,
            kills,
            accuracy,
            headshotAccuracy
        );


    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    const duplicate =
        db.prepare(`
            SELECT id
            FROM drills
            WHERE fingerprint = ?
        `).get(
            fingerprint
        );

    if (duplicate) {

        return {
            success: false,
            reason: "DUPLICATE"
        };

    }


    // --------------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------------

    const transaction =
        db.transaction(() => {

            const currentCount =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM drills
                    WHERE discord_id = ?
                    AND day_key = ?
                    AND status IN ('PENDING', 'APPROVED')
                `).get(
                    discordId,
                    dayKey
                );

            const count =
                Number(
                    currentCount?.total || 0
                );


            // ------------------------------------------------
            // HARD MAXIMUM: 4
            // ------------------------------------------------

            if (count >= 4) {

                return {
                    success: false,
                    reason: "DAILY_LIMIT",
                    count,
                    limit: 4
                };

            }


            // ------------------------------------------------
            // EXISTING PRIMARY LIMIT
            // ------------------------------------------------

            const progress =
                getDailyProgress(
                    discordId,
                    dayKey
                );

            if (
                roleType === "PRIMARY" &&
                progress.primary_count >= 2
            ) {

                return {
                    success: false,
                    reason: "PRIMARY_LIMIT"
                };

            }


            // ------------------------------------------------
            // EXISTING SECONDARY LIMIT
            // ------------------------------------------------

            if (
                roleType === "SECONDARY" &&
                progress.secondary_count >= 2
            ) {

                return {
                    success: false,
                    reason: "SECONDARY_LIMIT"
                };

            }


            // ------------------------------------------------
            // INSERT
            // ------------------------------------------------

            const result =
                db.prepare(`
                    INSERT INTO drills (
                        discord_id,
                        day_key,
                        role_type,
                        gun_role,
                        kills,
                        accuracy,
                        headshot_accuracy,
                        screenshot_url,
                        screenshot_message_id,
                        screenshot_channel_id,
                        fingerprint,
                        status,
                        submitted_at
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'PENDING',
                        ?
                    )
                `).run(
                    discordId,
                    dayKey,
                    roleType,
                    gunRole,
                    kills,
                    accuracy,
                    headshotAccuracy,
                    screenshotUrl,
                    screenshotMessageId,
                    screenshotChannelId,
                    fingerprint,
                    new Date().toISOString()
                );

            return {
                success: true,
                drillId:
                    result.lastInsertRowid,
                dayKey,
                countAfterSubmit:
                    count + 1
            };

        });

    return transaction();

}


// ============================================================
// APPROVE DRILL
// ============================================================

export function approveDrill(
    drillId,
    approvedBy
) {

    const drill =
        db.prepare(`
            SELECT *
            FROM drills
            WHERE id = ?
        `).get(
            drillId
        );

    if (!drill) {

        return {
            success: false,
            reason: "NOT_FOUND"
        };

    }

    if (
        drill.status !== "PENDING"
    ) {

        return {
            success: false,
            reason: "ALREADY_PROCESSED"
        };

    }

    const transaction =
        db.transaction(() => {

            db.prepare(`
                UPDATE drills
                SET
                    status = 'APPROVED',
                    approved_at = ?,
                    approved_by = ?
                WHERE id = ?
            `).run(
                new Date().toISOString(),
                approvedBy,
                drillId
            );

            const progress =
                getDailyProgress(
                    drill.discord_id,
                    drill.day_key
                );

            let primary =
                progress.primary_count;

            let secondary =
                progress.secondary_count;

            if (
                drill.role_type === "PRIMARY"
            ) {

                primary++;

            }

            if (
                drill.role_type === "SECONDARY"
            ) {

                secondary++;

            }

            const total =
                primary + secondary;

            const completed =
                primary >= 2 &&
                secondary >= 2
                    ? 1
                    : 0;

            db.prepare(`
                UPDATE daily_progress
                SET
                    primary_count = ?,
                    secondary_count = ?,
                    total_count = ?,
                    completed = ?
                WHERE discord_id = ?
                AND day_key = ?
            `).run(
                primary,
                secondary,
                total,
                completed,
                drill.discord_id,
                drill.day_key
            );

            if (completed) {

                updateStreak(
                    drill.discord_id,
                    drill.day_key
                );

            }

        });

    transaction();

    return {
        success: true,
        drill
    };

}


// ============================================================
// REJECT DRILL
// ============================================================

export function rejectDrill(
    drillId,
    rejectedBy
) {

    const drill =
        db.prepare(`
            SELECT *
            FROM drills
            WHERE id = ?
        `).get(
            drillId
        );

    if (!drill) {

        return {
            success: false,
            reason: "NOT_FOUND"
        };

    }

    if (
        drill.status !== "PENDING"
    ) {

        return {
            success: false,
            reason: "ALREADY_PROCESSED"
        };

    }

    db.prepare(`
        UPDATE drills
        SET
            status = 'REJECTED',
            approved_by = ?
        WHERE id = ?
    `).run(
        rejectedBy,
        drillId
    );

    return {
        success: true,
        drill
    };

}


// ============================================================
// RECALCULATE DAILY PROGRESS
// ============================================================
//
// Used after an APPROVED drill is deleted.
// Counts are rebuilt from the actual remaining APPROVED drills.
// This prevents incorrect decrementing and protects consistency.
// ============================================================

function recalculateDailyProgress(
    discordId,
    dayKey
) {

    const counts =
        db.prepare(`
            SELECT
                SUM(
                    CASE
                        WHEN role_type = 'PRIMARY'
                        THEN 1
                        ELSE 0
                    END
                ) AS primary_count,

                SUM(
                    CASE
                        WHEN role_type = 'SECONDARY'
                        THEN 1
                        ELSE 0
                    END
                ) AS secondary_count

            FROM drills

            WHERE discord_id = ?
            AND day_key = ?
            AND status = 'APPROVED'
        `).get(
            discordId,
            dayKey
        );

    const primary =
        Number(
            counts?.primary_count || 0
        );

    const secondary =
        Number(
            counts?.secondary_count || 0
        );

    const total =
        primary + secondary;

    const completed =
        primary >= 2 &&
        secondary >= 2
            ? 1
            : 0;


    const existing =
        db.prepare(`
            SELECT discord_id
            FROM daily_progress
            WHERE discord_id = ?
            AND day_key = ?
        `).get(
            discordId,
            dayKey
        );


    if (existing) {

        db.prepare(`
            UPDATE daily_progress
            SET
                primary_count = ?,
                secondary_count = ?,
                total_count = ?,
                completed = ?
            WHERE discord_id = ?
            AND day_key = ?
        `).run(
            primary,
            secondary,
            total,
            completed,
            discordId,
            dayKey
        );

    } else {

        db.prepare(`
            INSERT INTO daily_progress (
                discord_id,
                day_key,
                primary_count,
                secondary_count,
                total_count,
                completed
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            discordId,
            dayKey,
            primary,
            secondary,
            total,
            completed
        );

    }


    return {
        primary,
        secondary,
        total,
        completed
    };

}


// ============================================================
// RECALCULATE USER STREAK
// ============================================================
//
// Rebuilds streak history from actual completed days.
//
// A completed day means:
// PRIMARY >= 2 AND SECONDARY >= 2.
//
// Existing users are never deleted.
// Only their streak fields are recalculated.
// ============================================================

function recalculateUserStreak(
    discordId
) {

    const rows =
        db.prepare(`
            SELECT
                day_key,
                SUM(
                    CASE
                        WHEN role_type = 'PRIMARY'
                        THEN 1
                        ELSE 0
                    END
                ) AS primary_count,
                SUM(
                    CASE
                        WHEN role_type = 'SECONDARY'
                        THEN 1
                        ELSE 0
                    END
                ) AS secondary_count
            FROM drills
            WHERE discord_id = ?
            AND status = 'APPROVED'
            GROUP BY day_key
            ORDER BY day_key ASC
        `).all(
            discordId
        );


    const completedDays =
        rows
            .filter(row =>
                Number(row.primary_count || 0) >= 2 &&
                Number(row.secondary_count || 0) >= 2
            )
            .map(row => row.day_key);


    if (completedDays.length === 0) {

        db.prepare(`
            UPDATE users
            SET
                current_streak = 0,
                longest_streak = 0,
                last_completed_day = NULL
            WHERE discord_id = ?
        `).run(
            discordId
        );

        return {
            current: 0,
            longest: 0,
            lastCompletedDay: null
        };

    }


    let longest = 1;
    let running = 1;

    for (
        let i = 1;
        i < completedDays.length;
        i++
    ) {

        const previous =
            new Date(
                `${completedDays[i - 1]}T03:00:00+05:30`
            );

        const current =
            new Date(
                `${completedDays[i]}T03:00:00+05:30`
            );

        const difference =
            Math.round(
                (
                    current - previous
                ) /
                (1000 * 60 * 60 * 24)
            );


        if (difference === 1) {

            running++;

        } else {

            running = 1;

        }


        longest =
            Math.max(
                longest,
                running
            );

    }


    const lastCompletedDay =
        completedDays[
            completedDays.length - 1
        ];


    // Recalculate the streak ending at the latest completed day.
    let currentStreak = 1;

    for (
        let i = completedDays.length - 1;
        i > 0;
        i--
    ) {

        const previous =
            new Date(
                `${completedDays[i - 1]}T03:00:00+05:30`
            );

        const current =
            new Date(
                `${completedDays[i]}T03:00:00+05:30`
            );

        const difference =
            Math.round(
                (
                    current - previous
                ) /
                (1000 * 60 * 60 * 24)
            );


        if (difference === 1) {

            currentStreak++;

        } else {

            break;

        }

    }


    // Match the existing breakStreakIfNeeded behaviour:
    // if the latest completed day is more than one cycle behind,
    // the current streak is considered broken.
    const currentDay =
        getDailyCycle();

    const last =
        new Date(
            `${lastCompletedDay}T03:00:00+05:30`
        );

    const today =
        new Date(
            `${currentDay}T03:00:00+05:30`
        );

    const daysSinceLast =
        Math.round(
            (
                today - last
            ) /
            (1000 * 60 * 60 * 24)
        );


    if (daysSinceLast > 1) {

        currentStreak = 0;

    }


    db.prepare(`
        UPDATE users
        SET
            current_streak = ?,
            longest_streak = ?,
            last_completed_day = ?
        WHERE discord_id = ?
    `).run(
        currentStreak,
        longest,
        lastCompletedDay,
        discordId
    );


    return {
        current: currentStreak,
        longest,
        lastCompletedDay
    };

}


// ============================================================
// DELETE APPROVED DRILL
// ============================================================
//
// Safety rules:
//
// 1. Drill ID must exist.
// 2. Drill must belong to the requesting user.
// 3. Drill must be APPROVED.
// 4. Only that exact drill is deleted.
// 5. Daily progress is rebuilt from remaining APPROVED drills.
// 6. User streak is rebuilt from remaining completed days.
// 7. USERS records are never deleted.
// ============================================================

export function deleteApprovedDrill(
    discordId,
    drillId
) {

    const numericDrillId =
        Number(drillId);


    if (
        !Number.isInteger(numericDrillId) ||
        numericDrillId <= 0
    ) {

        return {
            success: false,
            reason: "INVALID_DRILL_ID"
        };

    }


    const drill =
        db.prepare(`
            SELECT *
            FROM drills
            WHERE id = ?
        `).get(
            numericDrillId
        );


    if (!drill) {

        return {
            success: false,
            reason: "NOT_FOUND"
        };

    }


    if (
        drill.discord_id !== discordId
    ) {

        return {
            success: false,
            reason: "NOT_OWNER"
        };

    }


    if (
        drill.status !== "APPROVED"
    ) {

        return {
            success: false,
            reason: "NOT_APPROVED"
        };

    }


    const transaction =
        db.transaction(() => {

            const current =
                db.prepare(`
                    SELECT *
                    FROM drills
                    WHERE id = ?
                    AND discord_id = ?
                    AND status = 'APPROVED'
                `).get(
                    numericDrillId,
                    discordId
                );


            if (!current) {

                return {
                    success: false,
                    reason: "NOT_APPROVED"
                };

            }


            const deleted =
                db.prepare(`
                    DELETE FROM drills
                    WHERE id = ?
                    AND discord_id = ?
                    AND status = 'APPROVED'
                `).run(
                    numericDrillId,
                    discordId
                );


            if (
                deleted.changes !== 1
            ) {

                return {
                    success: false,
                    reason: "DELETE_FAILED"
                };

            }


            // Rebuild the exact affected daily progress.
            const progress =
                recalculateDailyProgress(
                    discordId,
                    current.day_key
                );


            // Rebuild streaks from remaining approved history.
            const streak =
                recalculateUserStreak(
                    discordId
                );


            return {
                success: true,
                drill: current,
                progress,
                streak
            };

        });


    return transaction();

}


// ============================================================
// GET DRILL
// ============================================================

export function getDrill(
    drillId
) {

    return db.prepare(`
        SELECT *
        FROM drills
        WHERE id = ?
    `).get(
        drillId
    );

}


// ============================================================
// GET LAST APPROVED DRILL
// ============================================================

export function getLastDrill(
    discordId
) {

    return db.prepare(`
        SELECT *
        FROM drills
        WHERE discord_id = ?
        AND status = 'APPROVED'
        ORDER BY approved_at DESC
        LIMIT 1
    `).get(
        discordId
    );

}
