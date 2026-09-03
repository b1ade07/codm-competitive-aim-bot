import crypto from "crypto";

import db from "../database/database.js";
import { getDailyCycle } from "../utils/dailyCycle.js";
import { updateStreak } from "./streakService.js";


export function getUser(discordId) {
    return db.prepare(`
        SELECT *
        FROM users
        WHERE discord_id = ?
    `).get(discordId);
}


export function createOrUpdateUser(discordId, username) {

    const existing = getUser(discordId);

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

    const existing = getUser(discordId);

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


export function getDailyProgress(
    discordId,
    dayKey = getDailyCycle()
) {

    let progress = db.prepare(`
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


        progress = db.prepare(`
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

    const dayKey = getDailyCycle();


    const fingerprint = makeFingerprint(
        discordId,
        roleType,
        gunRole,
        kills,
        accuracy,
        headshotAccuracy
    );


    const duplicate = db.prepare(`
        SELECT id
        FROM drills
        WHERE fingerprint = ?
    `).get(fingerprint);


    if (duplicate) {

        return {
            success: false,
            reason: "DUPLICATE"
        };

    }


    const progress = getDailyProgress(
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


    if (
        roleType === "SECONDARY" &&
        progress.secondary_count >= 2
    ) {

        return {
            success: false,
            reason: "SECONDARY_LIMIT"
        };

    }


    const result = db.prepare(`
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
        drillId: result.lastInsertRowid,
        dayKey
    };
}


export function approveDrill(
    drillId,
    approvedBy
) {

    const drill = db.prepare(`
        SELECT *
        FROM drills
        WHERE id = ?
    `).get(drillId);


    if (!drill) {

        return {
            success: false,
            reason: "NOT_FOUND"
        };

    }


    if (drill.status !== "PENDING") {

        return {
            success: false,
            reason: "ALREADY_PROCESSED"
        };

    }


    const transaction = db.transaction(() => {

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


        const progress = getDailyProgress(
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


export function rejectDrill(
    drillId,
    rejectedBy
) {

    const drill = db.prepare(`
        SELECT *
        FROM drills
        WHERE id = ?
    `).get(drillId);


    if (!drill) {

        return {
            success: false,
            reason: "NOT_FOUND"
        };

    }


    if (drill.status !== "PENDING") {

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


export function getDrill(drillId) {

    return db.prepare(`
        SELECT *
        FROM drills
        WHERE id = ?
    `).get(drillId);

}


export function getLastDrill(discordId) {

    return db.prepare(`
        SELECT *
        FROM drills
        WHERE discord_id = ?
        AND status = 'APPROVED'
        ORDER BY approved_at DESC
        LIMIT 1
    `).get(discordId);

}