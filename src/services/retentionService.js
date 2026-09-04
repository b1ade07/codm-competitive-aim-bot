import db from "../database/database.js";
import { getDailyCycle } from "../utils/dailyCycle.js";


// ============================================================
// ONE-YEAR RETENTION CLEANUP
// ============================================================
//
// Retention policy:
// - Drill records are retained for one year.
// - APPROVED drill totals are archived before deletion.
// - PENDING / REJECTED drill records have no lifetime statistics
//   and can be removed after the retention period.
// - Users are NEVER deleted.
// - Lifetime archive rows are NEVER deleted.
//
// The cleanup is intentionally idempotent:
// archived drills are inserted into the aggregate archive and
// removed in the same SQLite transaction. A second execution
// cannot archive the same drill again because the drill row is
// already gone.
// ============================================================


const RETENTION_YEARS = 1;


// ============================================================
// GET RETENTION CUTOFF
// ============================================================

function getRetentionCutoff() {

    const currentDay =
        getDailyCycle();


    // Work with the daily-cycle calendar date itself.
    // This avoids depending on the Railway/server timezone.

    const current =
        new Date(
            `${currentDay}T00:00:00Z`
        );


    current.setUTCFullYear(
        current.getUTCFullYear() - RETENTION_YEARS
    );


    const year =
        current.getUTCFullYear();

    const month =
        String(
            current.getUTCMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            current.getUTCDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// ============================================================
// ARCHIVE APPROVED DRILLS
// ============================================================

function archiveApprovedDrills(
    drills
) {

    if (!drills.length) {
        return 0;
    }


    const grouped =
        new Map();


    for (const drill of drills) {

        const existing =
            grouped.get(
                drill.discord_id
            ) || {
                approved_count: 0,
                total_kills: 0,
                total_accuracy: 0,
                total_headshot_accuracy: 0,
                last_archived_day: null
            };


        existing.approved_count++;

        existing.total_kills +=
            Number(
                drill.kills || 0
            );

        existing.total_accuracy +=
            Number(
                drill.accuracy || 0
            );

        existing.total_headshot_accuracy +=
            Number(
                drill.headshot_accuracy || 0
            );


        if (
            !existing.last_archived_day ||
            drill.day_key >
                existing.last_archived_day
        ) {

            existing.last_archived_day =
                drill.day_key;

        }


        grouped.set(
            drill.discord_id,
            existing
        );

    }


    const update =
        db.prepare(`
            INSERT INTO lifetime_drill_stats (
                discord_id,
                approved_count,
                total_kills,
                total_accuracy,
                total_headshot_accuracy,
                last_archived_day,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(discord_id)
            DO UPDATE SET
                approved_count =
                    lifetime_drill_stats.approved_count
                    + excluded.approved_count,

                total_kills =
                    lifetime_drill_stats.total_kills
                    + excluded.total_kills,

                total_accuracy =
                    lifetime_drill_stats.total_accuracy
                    + excluded.total_accuracy,

                total_headshot_accuracy =
                    lifetime_drill_stats.total_headshot_accuracy
                    + excluded.total_headshot_accuracy,

                last_archived_day =
                    CASE
                        WHEN lifetime_drill_stats.last_archived_day IS NULL
                        THEN excluded.last_archived_day

                        WHEN excluded.last_archived_day >
                             lifetime_drill_stats.last_archived_day
                        THEN excluded.last_archived_day

                        ELSE lifetime_drill_stats.last_archived_day
                    END,

                updated_at = excluded.updated_at
        `);


    const now =
        new Date().toISOString();


    for (
        const [
            discordId,
            values
        ] of grouped
    ) {

        update.run(
            discordId,
            values.approved_count,
            values.total_kills,
            values.total_accuracy,
            values.total_headshot_accuracy,
            values.last_archived_day,
            now
        );

    }


    return drills.length;

}


// ============================================================
// CLEANUP OLD DATA
// ============================================================

export async function cleanupOldDrillData(client = null) {

    const cutoff =
        getRetentionCutoff();


    const oldDrillsForDiscordCleanup =
        db.prepare(`
            SELECT
                id,
                screenshot_message_id,
                screenshot_channel_id
            FROM drills
            WHERE day_key < ?
              AND screenshot_message_id IS NOT NULL
              AND screenshot_channel_id IS NOT NULL
            ORDER BY id ASC
        `).all(
            cutoff
        );


    let discordMessagesDeleted = 0;


    if (client) {

        for (const drill of oldDrillsForDiscordCleanup) {

            try {

                const channel =
                    await client.channels.fetch(
                        String(
                            drill.screenshot_channel_id
                        )
                    );


                if (
                    channel &&
                    channel.isTextBased()
                ) {

                    const message =
                        await channel.messages.fetch(
                            String(
                                drill.screenshot_message_id
                            )
                        );


                    if (message) {

                        await message.delete();

                        discordMessagesDeleted++;

                    }

                }

            } catch (error) {

                console.warn(
                    `[RETENTION] Could not delete Discord message for drill ${drill.id}:`,
                    error?.message || error
                );

            }

        }

    }


    const transaction =
        db.transaction(() => {

            const oldDrills =
                db.prepare(`
                    SELECT *
                    FROM drills
                    WHERE day_key < ?
                    ORDER BY id ASC
                `).all(
                    cutoff
                );


            if (
                oldDrills.length === 0
            ) {

                return {
                    cutoff,
                    drillsFound: 0,
                    approvedArchived: 0,
                    drillsDeleted: 0,
                    progressDeleted: 0,
                    discordMessagesDeleted
                };

            }


            const approvedDrills =
                oldDrills.filter(
                    drill =>
                        drill.status === "APPROVED"
                );


            const approvedArchived =
                archiveApprovedDrills(
                    approvedDrills
                );


            const drillIds =
                oldDrills.map(
                    drill => drill.id
                );


            let drillsDeleted = 0;


            if (
                drillIds.length
            ) {

                const placeholders =
                    drillIds
                        .map(() => "?")
                        .join(",");


                const deleted =
                    db.prepare(`
                        DELETE FROM drills
                        WHERE id IN (${placeholders})
                    `).run(
                        ...drillIds
                    );


                drillsDeleted =
                    deleted.changes;

            }


            const progressDeleted =
                db.prepare(`
                    DELETE FROM daily_progress
                    WHERE day_key < ?
                `).run(
                    cutoff
                ).changes;


            return {
                cutoff,
                drillsFound:
                    oldDrills.length,
                approvedArchived,
                drillsDeleted,
                progressDeleted,
                discordMessagesDeleted
            };

        });


    const result =
        transaction();


    console.log(
        "[RETENTION] Cleanup completed:",
        result
    );


    return result;

}


// ============================================================
// START DAILY RETENTION CLEANUP
// ============================================================
//
// Run once immediately, then once every 24 hours.
// ============================================================

export function startRetentionCleanup(client) {

    const runCleanup = async () => {

        try {

            await cleanupOldDrillData(
                client
            );

        } catch (error) {

            console.error(
                "[RETENTION] Cleanup failed:",
                error
            );

        }

    };


    // Run once when the bot starts.

    runCleanup();


    // Then run every 24 hours.

    const interval =
        24 * 60 * 60 * 1000;


    setInterval(
        runCleanup,
        interval
    );

}

