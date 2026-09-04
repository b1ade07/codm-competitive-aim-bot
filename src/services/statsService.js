import db from "../database/database.js";


// ============================================================
// LIFETIME STATISTICS
// ============================================================
//
// Lifetime statistics are calculated from:
//
// 1. Archived approved drills
// 2. Currently retained approved drills
//
// This ensures the one-year retention cleanup does not reduce
// a user's lifetime statistics.
// ============================================================

export function getLifetimeStats(
    discordId
) {

    const archive =
        db.prepare(`
            SELECT
                approved_count,
                total_kills,
                total_accuracy,
                total_headshot_accuracy
            FROM lifetime_drill_stats
            WHERE discord_id = ?
        `).get(
            discordId
        );


    const current =
        db.prepare(`
            SELECT
                COUNT(*) AS total,
                COALESCE(
                    SUM(kills),
                    0
                ) AS total_kills,
                COALESCE(
                    SUM(accuracy),
                    0
                ) AS total_accuracy,
                COALESCE(
                    SUM(headshot_accuracy),
                    0
                ) AS total_headshot_accuracy
            FROM drills
            WHERE discord_id = ?
            AND status = 'APPROVED'
        `).get(
            discordId
        );


    const archivedCount =
        Number(
            archive?.approved_count || 0
        );

    const currentCount =
        Number(
            current?.total || 0
        );

    const total =
        archivedCount +
        currentCount;


    const totalKills =
        Number(
            archive?.total_kills || 0
        ) +
        Number(
            current?.total_kills || 0
        );


    const totalAccuracy =
        Number(
            archive?.total_accuracy || 0
        ) +
        Number(
            current?.total_accuracy || 0
        );


    const totalHeadshotAccuracy =
        Number(
            archive?.total_headshot_accuracy || 0
        ) +
        Number(
            current?.total_headshot_accuracy || 0
        );


    return {

        total,

        avgKills:
            total > 0
                ? totalKills / total
                : 0,

        avgAccuracy:
            total > 0
                ? totalAccuracy / total
                : 0,

        avgHeadshotAccuracy:
            total > 0
                ? totalHeadshotAccuracy / total
                : 0

    };

}


// ============================================================
// LAST APPROVED DRILL
// ============================================================
//
// The most recent individual drill must still come from the
// retained drills table. Archived drills no longer have their
// individual records.
// ============================================================

export function getLastApprovedDrill(
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


// ============================================================
// IMPROVEMENT
// ============================================================

export function getImprovement(
    current,
    previous
) {

    if (!previous) {

        return {
            killsChange: null,
            accuracyChange: null,
            headshotChange: null
        };

    }


    return {

        killsChange:
            Number(current.kills) -
            Number(previous.kills),

        accuracyChange:
            Number(current.accuracy) -
            Number(previous.accuracy),

        headshotChange:
            Number(current.headshot_accuracy) -
            Number(previous.headshot_accuracy)

    };

}
