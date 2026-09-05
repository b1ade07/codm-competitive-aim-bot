import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";

import db from "../database/database.js";


// ============================================================
// START LEADERBOARD
// ============================================================

export async function startLeaderboard(
    interaction
) {

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `leaderboard:${interaction.user.id}`
            )
            .setPlaceholder(
                "SELECT LEADERBOARD CATEGORY"
            )
            .addOptions(

                {
                    label: "TOTAL NUMBER OF KILLS",

                    value: "total_kills",

                    description:
                        "Total approved kills in the current year"

                },

                {
                    label: "KILLS",

                    value: "kills",

                    description:
                        "Lifetime average kills"

                },

                {
                    label: "ACCURACY",

                    value: "accuracy",

                    description:
                        "Lifetime average accuracy"

                },

                {
                    label:
                        "HEADSHOT ACCURACY",

                    value:
                        "headshot_accuracy",

                    description:
                        "Lifetime average headshot accuracy"

                }

            );


    const row =
        new ActionRowBuilder()
            .addComponents(
                menu
            );


    const embed =
        new EmbedBuilder()
            .setTitle(
                "\U0001F3C6 AIM DRILLS LIFETIME LEADERBOARD"
            )
            .setDescription(
                "Select the statistic you want to view.\n\n" +

                "\U0001F4CA Leaderboards are based on **APPROVED DRILLS ONLY**.\n" +

                "\u267E\uFE0F Historical data is never reset."
            );


    await interaction.reply({

        embeds: [
            embed
        ],

        components: [
            row
        ]

    });

}


// ============================================================
// SHOW LEADERBOARD
// ============================================================

export async function showLeaderboard(
    interaction,
    category
) {


    // --------------------------------------------------------
    // Allowed categories
    // --------------------------------------------------------

    const allowedCategories = {

        total_kills:
            "TOTAL NUMBER OF KILLS",

        kills:
            "KILLS",

        accuracy:
            "ACCURACY",

        headshot_accuracy:
            "HEADSHOT ACCURACY"

    };


    const categoryName =
        allowedCategories[category];


    if (!categoryName) {

        return await interaction.update({

            content:
                "\u274C Invalid leaderboard category.",

            embeds: [],

            components: []

        });

    }


    // --------------------------------------------------------
    // Get lifetime statistics
    // --------------------------------------------------------

    const rows =
        dbQueryLeaderboard(
            category
        );


    let description =
        "";


    // --------------------------------------------------------
    // No approved data
    // --------------------------------------------------------

    if (
        !rows.length
    ) {

        description =
            "No approved drills yet.";

    }


    // --------------------------------------------------------
    // Build leaderboard
    // --------------------------------------------------------

    else {

        description =
            rows
                .map(
                    (
                        row,
                        index
                    ) => {

                        const value =
                            Number(
                                row.value
                            );


                        const formatted =

                            category === "total_kills"

                                ? value.toFixed(0)

                                : category === "kills"

                                    ? value.toFixed(2)

                                    : `${value.toFixed(2)}%`;


                        return (

                            `**${index + 1}.** ` +

                            `${row.username} — ` +

                            `**${formatted}**`

                        );

                    }
                )
                .join("\n");

    }


    // --------------------------------------------------------
    // Create result embed
    // --------------------------------------------------------

    const embed =
        new EmbedBuilder()
            .setTitle(
                `\U0001F3C6 ${categoryName} LEADERBOARD`
            )
            .setDescription(
                description
            )
            .setFooter({

                text:
                    "Lifetime approved-drill averages • Historical data retained"

            });


    // --------------------------------------------------------
    // Update original leaderboard message
    // --------------------------------------------------------

    await interaction.update({

        embeds: [
            embed
        ],

        components: []

    });

}


// ============================================================
// DATABASE LEADERBOARD QUERY
// ============================================================
//
// Lifetime result =
//     archived approved drills
//     +
//     currently retained approved drills
//
// This prevents the one-year retention cleanup from reducing
// lifetime leaderboard statistics.
// ============================================================

function dbQueryLeaderboard(
    category
) {

    if (category === "total_kills") {
        const year = new Intl.DateTimeFormat(
            "en-US",
            { timeZone: "Asia/Kolkata", year: "numeric" }
        ).format(new Date());

        const yearStart = `${year}-01-01T00:00:00`;
        const nextYearStart = `${Number(year) + 1}-01-01T00:00:00`;

        return db.prepare(`
            SELECT users.discord_id AS discord_id,
                   users.username AS username,
                   COALESCE(SUM(drills.kills), 0) AS value
            FROM users
            INNER JOIN drills ON drills.discord_id = users.discord_id
            WHERE drills.status = "APPROVED"
              AND drills.submitted_at >= ?
              AND drills.submitted_at < ?
            GROUP BY users.discord_id, users.username
            ORDER BY value DESC
            LIMIT 25
        `).all(yearStart, nextYearStart);
    }


    const valueExpression = {

        kills:
            "((COALESCE(archive.total_kills, 0) + COALESCE(current.total_kills, 0)) / NULLIF(COALESCE(archive.approved_count, 0) + COALESCE(current.approved_count, 0), 0))",

        accuracy:
            "((COALESCE(archive.total_accuracy, 0) + COALESCE(current.total_accuracy, 0)) / NULLIF(COALESCE(archive.approved_count, 0) + COALESCE(current.approved_count, 0), 0))",

        headshot_accuracy:
            "((COALESCE(archive.total_headshot_accuracy, 0) + COALESCE(current.total_headshot_accuracy, 0)) / NULLIF(COALESCE(archive.approved_count, 0) + COALESCE(current.approved_count, 0), 0))"

    };


    const expression =
        valueExpression[category];


    if (!expression) {

        return [];

    }


    return db.prepare(`

        SELECT

            users.discord_id AS discord_id,

            users.username AS username,

            ${expression} AS value

        FROM users

        LEFT JOIN (

            SELECT

                discord_id,

                approved_count,

                total_kills,

                total_accuracy,

                total_headshot_accuracy

            FROM lifetime_drill_stats

        ) AS archive

            ON archive.discord_id =
                users.discord_id

        LEFT JOIN (

            SELECT

                discord_id,

                COUNT(*) AS approved_count,

                COALESCE(SUM(kills), 0) AS total_kills,

                COALESCE(SUM(accuracy), 0) AS total_accuracy,

                COALESCE(SUM(headshot_accuracy), 0) AS total_headshot_accuracy

            FROM drills

            WHERE status =
                'APPROVED'

            GROUP BY
                discord_id

        ) AS current

            ON current.discord_id =
                users.discord_id

        WHERE

            COALESCE(archive.approved_count, 0) +

            COALESCE(current.approved_count, 0) >

            0

        ORDER BY
            value DESC

        LIMIT 25

    `).all();

}
