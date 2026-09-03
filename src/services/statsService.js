import db from "../database/database.js";


export function getLifetimeStats(discordId) {

    const result = db.prepare(`
        SELECT
            COUNT(*) AS total,
            AVG(kills) AS avg_kills,
            AVG(accuracy) AS avg_accuracy,
            AVG(headshot_accuracy) AS avg_headshot_accuracy
        FROM drills
        WHERE discord_id = ?
        AND status = 'APPROVED'
    `).get(discordId);


    return {
        total: result.total || 0,
        avgKills: result.avg_kills || 0,
        avgAccuracy: result.avg_accuracy || 0,
        avgHeadshotAccuracy:
            result.avg_headshot_accuracy || 0
    };
}


export function getLastApprovedDrill(discordId) {

    return db.prepare(`
        SELECT *
        FROM drills
        WHERE discord_id = ?
        AND status = 'APPROVED'
        ORDER BY approved_at DESC
        LIMIT 1
    `).get(discordId);

}


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