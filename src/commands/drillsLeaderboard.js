import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";

import db from "../database/database.js";


// ============================================================
// PERIOD HELPERS
// ============================================================

function getCurrentDayKey() {

    const now = new Date();

    const ist =
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone: "Asia/Kolkata"
                }
            )
        );

    if (ist.getHours() < 3) {
        ist.setDate(
            ist.getDate() - 1
        );
    }

    const year =
        ist.getFullYear();

    const month =
        String(
            ist.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            ist.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getPeriod(
    period
) {

    const dayKey =
        getCurrentDayKey();

    const date =
        new Date(
            `${dayKey}T00:00:00`
        );

    let start;
    let end;


    // --------------------------------------------------------
    // DAILY
    // --------------------------------------------------------

    if (period === "daily") {

        start =
            dayKey;

        end =
            dayKey;

    }


    // --------------------------------------------------------
    // WEEKLY — MONDAY TO SUNDAY
    // --------------------------------------------------------

    else if (period === "weekly") {

        const day =
            date.getDay();

        const difference =
            day === 0
                ? 6
                : day - 1;

        const monday =
            new Date(date);

        monday.setDate(
            monday.getDate() - difference
        );

        const sunday =
            new Date(monday);

        sunday.setDate(
            sunday.getDate() + 6
        );

        start =
            formatDate(monday);

        end =
            formatDate(sunday);

    }


    // --------------------------------------------------------
    // MONTHLY
    // --------------------------------------------------------

    else if (period === "monthly") {

        const first =
            new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            );

        const last =
            new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0
            );

        start =
            formatDate(first);

        end =
            formatDate(last);

    }


    // --------------------------------------------------------
    // YEARLY
    // --------------------------------------------------------

    else if (period === "yearly") {

        start =
            `${date.getFullYear()}-01-01`;

        end =
            `${date.getFullYear()}-12-31`;

    }


    else {

        throw new Error(
            `Invalid leaderboard period: ${period}`
        );

    }


    return {
        start,
        end
    };

}


function formatDate(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// ============================================================
// DATABASE QUERY
// ============================================================

function getLeaderboard(
    start,
    end
) {

    return db.prepare(`

        SELECT

            users.discord_id AS discord_id,

            users.username AS username,

            COUNT(
                drills.id
            ) AS drill_count

        FROM users

        LEFT JOIN drills

            ON drills.discord_id =
                users.discord_id

            AND drills.status =
                'APPROVED'

            AND drills.day_key >= ?

            AND drills.day_key <= ?

        GROUP BY
            users.discord_id

        ORDER BY
            drill_count DESC,

            users.username COLLATE NOCASE ASC

    `).all(
        start,
        end
    );

}


// ============================================================
// START LEADERBOARD
// ============================================================

export async function startDrillsLeaderboard(
    interaction
) {

    const menu =
        new StringSelectMenuBuilder()

            .setCustomId(
                `drills-leaderboard:${interaction.user.id}`
            )

            .setPlaceholder(
                "SELECT TIME PERIOD"
            )

            .addOptions(

                {
                    label: "DAILY",
                    value: "daily",
                    description:
                        "Current daily cycle"
                },

                {
                    label: "WEEKLY",
                    value: "weekly",
                    description:
                        "Monday to Sunday"
                },

                {
                    label: "MONTHLY",
                    value: "monthly",
                    description:
                        "Current calendar month"
                },

                {
                    label: "YEARLY",
                    value: "yearly",
                    description:
                        "Current calendar year"
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
                "🏆 AIM DRILLS COMPETITIVE LEADERBOARD"
            )

            .setDescription(

                "Select the time period you want to view.\n\n" +

                "📌 Counts **APPROVED DRILLS ONLY**.\n" +

                "📌 All registered users are included."

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
// SHOW PERIOD LEADERBOARD
// ============================================================

export async function showDrillsLeaderboard(
    interaction,
    period
) {

    try {

        const {
            start,
            end
        } =
            getPeriod(
                period
            );


        const rows =
            getLeaderboard(
                start,
                end
            );


        const names = {

            daily:
                "DAILY",

            weekly:
                "WEEKLY",

            monthly:
                "MONTHLY",

            yearly:
                "YEARLY"

        };


        const title =
            names[period];


        if (!title) {

            return await interaction.update({

                content:
                    "❌ Invalid leaderboard period.",

                embeds: [],

                components: []

            });

        }


        let description =
            "";


        if (!rows.length) {

            description =
                "No registered users found.";

        }

        else {

            description =
                rows
                    .map(
                        (
                            row,
                            index
                        ) => {

                            const rank =
                                index + 1;

                            const mention =
                                `<@${row.discord_id}>`;

                            const count =
                                Number(
                                    row.drill_count
                                );


                            return (

                                `**${rank}.** ` +

                                `${mention} — ` +

                                `**${count} DRILL${count === 1 ? "" : "S"}**`

                            );

                        }
                    )
                    .join("\n");

        }


        const embed =
            new EmbedBuilder()

                .setTitle(
                    `🏆 ${title} AIM DRILLS LEADERBOARD`
                )

                .setDescription(
                    description
                )

                .setFooter({

                    text:
                        `${start} → ${end} • APPROVED DRILLS ONLY`

                });


        await interaction.update({

            embeds: [
                embed
            ],

            components: []

        });


    } catch (error) {

        console.error(
            "DRILLS LEADERBOARD ERROR:",
            error
        );


        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({

                content:
                    "❌ Unable to load the drills leaderboard.",

                ephemeral: true

            });

        }

        else {

            await interaction.reply({

                content:
                    "❌ Unable to load the drills leaderboard.",

                ephemeral: true

            });

        }

    }

}
