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
                "🏆 AIM DRILLS LIFETIME LEADERBOARD"
            )
            .setDescription(
                "Select the statistic you want to view.\n\n" +

                "📌 Leaderboards are based on **APPROVED DRILLS ONLY**.\n" +

                "📌 Historical data is never reset."
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
    // Allowed database columns
    // --------------------------------------------------------

    const columns = {

        kills:
            "AVG(kills)",

        accuracy:
            "AVG(accuracy)",

        headshot_accuracy:
            "AVG(headshot_accuracy)"

    };


    const column =
        columns[category];


    if (!column) {

        return await interaction.update({

            content:
                "❌ Invalid leaderboard category.",

            embeds: [],

            components: []

        });

    }


    // --------------------------------------------------------
    // Get APPROVED drills only
    // --------------------------------------------------------

    const rows =
        dbQueryLeaderboard(
            column
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
                            category ===
                            "kills"

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
    // Titles
    // --------------------------------------------------------

    const names = {

        kills:
            "KILLS",

        accuracy:
            "ACCURACY",

        headshot_accuracy:
            "HEADSHOT ACCURACY"

    };


    // --------------------------------------------------------
    // Create result embed
    // --------------------------------------------------------

    const embed =
        new EmbedBuilder()
            .setTitle(
                `🏆 ${names[category]} LEADERBOARD`
            )
            .setDescription(
                description
            )
            .setFooter({

                text:
                    "Lifetime approved-drill averages • Never reset"

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

function dbQueryLeaderboard(
    column
) {

    return db.prepare(`

        SELECT

            users.username AS username,

            ${column} AS value

        FROM drills

        INNER JOIN users

            ON users.discord_id =
                drills.discord_id

        WHERE drills.status =
            'APPROVED'

        GROUP BY
            drills.discord_id

        ORDER BY
            value DESC

        LIMIT 25

    `).all();

}