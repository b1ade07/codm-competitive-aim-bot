import {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder
} from "discord.js";

import {
    getUser,
    submitDrill,
    approveDrill,
    getDailyProgress,
    getDrill,
    getLastDrill
} from "../services/drillService.js";

import {
    validateKills,
    validatePercentage,
    isImageAttachment
} from "../utils/validation.js";


// ============================================================
// /submit-drill
// ============================================================

export async function startSubmitDrill(interaction) {

    try {

        const userId = interaction.user.id;

        // ----------------------------------------------------
        // GET REGISTERED USER
        // ----------------------------------------------------

        const user = getUser(userId);

        if (
            !user ||
            !user.primary_role ||
            !user.secondary_role
        ) {

            return await interaction.reply({
                content:
                    "❌ **PLEASE COMPLETE /SETUP-ROLES FIRST.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // GET ALL REQUIRED COMMAND OPTIONS
        // ----------------------------------------------------

        const screenshot =
            interaction.options.getAttachment(
                "screenshot"
            );

        const totalKills =
            interaction.options.getInteger(
                "total_kills"
            );

        const accuracy =
            interaction.options.getNumber(
                "accuracy"
            );

        const headshotAccuracy =
            interaction.options.getNumber(
                "headshot_accuracy"
            );

        const drillType =
            interaction.options.getString(
                "drill_type"
            );


        // ----------------------------------------------------
        // CHECK SCREENSHOT
        // ----------------------------------------------------

        if (
            !screenshot ||
            !isImageAttachment(screenshot)
        ) {

            return await interaction.reply({
                content:
                    "❌ **PLEASE UPLOAD A VALID IMAGE SCREENSHOT.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // CHECK KILLS
        // ----------------------------------------------------

        if (
            !validateKills(totalKills)
        ) {

            return await interaction.reply({
                content:
                    "❌ **TOTAL NUMBER OF KILLS MUST BE A VALID WHOLE NUMBER.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // CHECK ACCURACY
        // ----------------------------------------------------

        if (
            !validatePercentage(accuracy)
        ) {

            return await interaction.reply({
                content:
                    "❌ **ACCURACY MUST BE BETWEEN 0 AND 100.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // CHECK HEADSHOT ACCURACY
        // ----------------------------------------------------

        if (
            !validatePercentage(headshotAccuracy)
        ) {

            return await interaction.reply({
                content:
                    "❌ **HEADSHOT ACCURACY MUST BE BETWEEN 0 AND 100.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // CHECK DRILL TYPE
        // ----------------------------------------------------

        if (
            drillType !== "PRIMARY" &&
            drillType !== "SECONDARY"
        ) {

            return await interaction.reply({
                content:
                    "❌ **DRILL TYPE MUST BE PRIMARY OR SECONDARY.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // GET THE PERMANENT GUN ROLE
        // ----------------------------------------------------

        let gunRole;

        if (
            drillType === "PRIMARY"
        ) {

            gunRole =
                user.primary_role;

        } else {

            gunRole =
                user.secondary_role;

        }


        // ----------------------------------------------------
        // SUBMIT TO DATABASE
        // ----------------------------------------------------

        const result = submitDrill({

            discordId:
                userId,

            roleType:
                drillType,

            gunRole:
                gunRole,

            kills:
                totalKills,

            accuracy:
                Number(accuracy),

            headshotAccuracy:
                Number(headshotAccuracy),

            screenshotUrl:
                screenshot.url,

            screenshotMessageId:
                null,

            screenshotChannelId:
                interaction.channelId

        });


        // ----------------------------------------------------
        // HANDLE DATABASE REJECTION
        // ----------------------------------------------------

        if (!result || !result.success) {

            if (
                result?.reason === "DUPLICATE"
            ) {

                return await interaction.reply({
                    content:
                        "HAVE SOME SHAME BROTHER SHE ALSO CHEATED U LIKE THIS :)",
                    ephemeral: true
                });

            }


            if (
                result?.reason === "PRIMARY_LIMIT"
            ) {

                return await interaction.reply({
                    content:
                        "❌ **YOU HAVE ALREADY REACHED YOUR PRIMARY DRILL LIMIT OF 2 FOR TODAY.**",
                    ephemeral: true
                });

            }


            if (
                result?.reason === "SECONDARY_LIMIT"
            ) {

                return await interaction.reply({
                    content:
                        "❌ **YOU HAVE ALREADY REACHED YOUR SECONDARY DRILL LIMIT OF 2 FOR TODAY.**",
                    ephemeral: true
                });

            }


            return await interaction.reply({
                content:
                    "❌ **DRILL COULD NOT BE SUBMITTED.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // GET PREVIOUS APPROVED DRILL
        // ----------------------------------------------------

        const previous =
            getLastDrill(userId);


        // ----------------------------------------------------
        // GET LIFETIME APPROVED DRILLS
        // ----------------------------------------------------

        const lifetime =
            getLifetimeStatsLocal(userId);


        // ----------------------------------------------------
        // CALCULATE CHANGE
        // ----------------------------------------------------

        let improvement = null;

        if (previous) {

            improvement = {

                kills:
                    totalKills -
                    Number(previous.kills),

                accuracy:
                    Number(accuracy) -
                    Number(previous.accuracy),

                headshotAccuracy:
                    Number(headshotAccuracy) -
                    Number(previous.headshot_accuracy)

            };

        }


        // ----------------------------------------------------
        // CREATE PUBLIC EMBED
        // ----------------------------------------------------

        const embed =
            new EmbedBuilder()
                .setTitle(
                    "🎯 AIM DRILL SUBMISSION"
                )
                .setDescription(
                    `**PLAYER:** <@${userId}>\n` +
                    `**DRILL TYPE:** ${drillType}\n` +
                    `**GUN ROLE:** ${gunRole}\n` +
                    `**STATUS:** ⏳ PENDING APPROVAL`
                )
                .addFields(

                    {
                        name:
                            "🎯 TOTAL KILLS",
                        value:
                            `${totalKills}`,
                        inline: true
                    },

                    {
                        name:
                            "📈 ACCURACY",
                        value:
                            `${Number(accuracy).toFixed(2)}%`,
                        inline: true
                    },

                    {
                        name:
                            "🎯 HEADSHOT ACCURACY",
                        value:
                            `${Number(headshotAccuracy).toFixed(2)}%`,
                        inline: true
                    }

                )
                .setImage(
                    screenshot.url
                );


        // ----------------------------------------------------
        // PERFORMANCE CHANGE
        // ----------------------------------------------------

        if (
            previous &&
            improvement
        ) {

            embed.addFields({

                name:
                    "📊 CHANGE FROM LAST APPROVED DRILL",

                value:
                    `Kills: ${formatChange(improvement.kills)}\n` +
                    `Accuracy: ${formatChange(improvement.accuracy)}\n` +
                    `Headshot Accuracy: ${formatChange(improvement.headshotAccuracy)}`,

                inline: false

            });

        } else {

            embed.addFields({

                name:
                    "📊 CHANGE FROM LAST APPROVED DRILL",

                value:
                    "This is your first approved drill.",

                inline: false

            });

        }


        // ----------------------------------------------------
        // LIFETIME AVERAGES
        // ----------------------------------------------------

        if (lifetime) {

            embed.addFields({

                name:
                    "🏆 LIFETIME AVERAGES",

                value:
                    `Kills: ${formatNumber(lifetime.avgKills)}\n` +
                    `Accuracy: ${formatNumber(lifetime.avgAccuracy)}%\n` +
                    `Headshot Accuracy: ${formatNumber(lifetime.avgHeadshotAccuracy)}%`,

                inline: false

            });

        }


        // ----------------------------------------------------
        // APPROVE BUTTON
        // ----------------------------------------------------

        const approveButton =
            new ButtonBuilder()
                .setCustomId(
                    `drill_approve:${result.drillId}:${userId}`
                )
                .setLabel(
                    "APPROVE DRILL"
                )
                .setEmoji(
                    "✅"
                )
                .setStyle(
                    ButtonStyle.Success
                );


        const row =
            new ActionRowBuilder()
                .addComponents(
                    approveButton
                );


        // ----------------------------------------------------
        // PUBLIC SUBMISSION
        // ----------------------------------------------------

        return await interaction.reply({

            embeds: [
                embed
            ],

            components: [
                row
            ]

        });

    } catch (error) {

        console.error(
            "SUBMIT DRILL ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({

                content:
                    "❌ **AN ERROR OCCURRED WHILE STORING YOUR DRILL.**",

                ephemeral: true

            });

        }

    }

}


// ============================================================
// APPROVE DRILL
// ============================================================

export async function handleApproval(interaction) {

    try {

        const parts =
            interaction.customId.split(":");


        const drillId =
            Number(parts[1]);


        const ownerId =
            parts[2];


        // ----------------------------------------------------
        // ONLY THE PLAYER WHO SUBMITTED IT CAN APPROVE
        // ----------------------------------------------------

        if (
            interaction.user.id !== ownerId
        ) {

            return await interaction.reply({

                content:
                    "❌ **ONLY THE PLAYER WHO SUBMITTED THIS DRILL CAN APPROVE IT.**",

                ephemeral: true

            });

        }


        // ----------------------------------------------------
        // APPROVE IN DATABASE
        // ----------------------------------------------------

        const result =
            approveDrill(
                drillId,
                interaction.user.id
            );


        if (
            !result ||
            !result.success
        ) {

            return await interaction.reply({

                content:
                    "❌ **THIS DRILL COULD NOT BE APPROVED.**",

                ephemeral: true

            });

        }


        // ----------------------------------------------------
        // GET APPROVED DRILL
        // ----------------------------------------------------

        const drill =
            getDrill(drillId);


        // ----------------------------------------------------
        // GET CURRENT PROGRESS
        // ----------------------------------------------------

        const progress =
            getDailyProgress(
                ownerId,
                drill.day_key
            );


        // ----------------------------------------------------
        // APPROVED EMBED
        // ----------------------------------------------------

        const approvedEmbed =
            new EmbedBuilder()
                .setTitle(
                    "🎯 AIM DRILL SUBMISSION"
                )
                .setDescription(

                    `**PLAYER:** <@${ownerId}>\n` +
                    `**DRILL TYPE:** ${drill.role_type}\n` +
                    `**GUN ROLE:** ${drill.gun_role}\n` +
                    `**STATUS:** ✅ APPROVED`

                )
                .addFields(

                    {
                        name:
                            "🎯 TOTAL KILLS",
                        value:
                            `${drill.kills}`,
                        inline: true
                    },

                    {
                        name:
                            "📈 ACCURACY",
                        value:
                            `${Number(drill.accuracy).toFixed(2)}%`,
                        inline: true
                    },

                    {
                        name:
                            "🎯 HEADSHOT ACCURACY",
                        value:
                            `${Number(drill.headshot_accuracy).toFixed(2)}%`,
                        inline: true
                    },

                    {
                        name:
                            "📅 DAILY PROGRESS",
                        value:
                            `PRIMARY: ${progress.primary_count}/2\n` +
                            `SECONDARY: ${progress.secondary_count}/2\n` +
                            `TOTAL: ${progress.total_count}/4`,
                        inline: false
                    }

                )
                .setImage(
                    drill.screenshot_url
                )
                .setFooter({
                    text:
                        `Drill ID: ${drillId} • APPROVED`
                });


        // ----------------------------------------------------
        // UPDATE PUBLIC MESSAGE
        // ----------------------------------------------------

        await interaction.update({

            embeds: [
                approvedEmbed
            ],

            components: []

        });


        // ----------------------------------------------------
        // SUCCESS MESSAGE
        // ----------------------------------------------------

        return await interaction.followUp({

            content:

                "✅ **UR DATA HAS BEEN SUCCESFULLY IMPORTED AND STORED**\n\n" +

                `🎯 PRIMARY: **${progress.primary_count}/2**\n` +

                `🔫 SECONDARY: **${progress.secondary_count}/2**\n` +

                `🏆 TOTAL: **${progress.total_count}/4**`

        });

    } catch (error) {

        console.error(
            "APPROVAL ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({

                content:
                    "❌ **AN ERROR OCCURRED WHILE APPROVING THE DRILL.**",

                ephemeral: true

            });

        }

    }

}


// ============================================================
// LOCAL LIFETIME STATISTICS
// ============================================================

function getLifetimeStatsLocal(discordId) {

    // This function intentionally uses the approved drills
    // directly so the submission workflow does not depend
    // on another service export.

    try {

        const db =
            getDatabase();

        const row =
            db.prepare(`
                SELECT
                    AVG(kills) AS avgKills,
                    AVG(accuracy) AS avgAccuracy,
                    AVG(headshot_accuracy) AS avgHeadshotAccuracy,
                    COUNT(*) AS totalDrills
                FROM drills
                WHERE discord_id = ?
                AND status = 'APPROVED'
            `).get(
                discordId
            );

        if (
            !row ||
            Number(row.totalDrills) === 0
        ) {

            return null;

        }

        return row;

    } catch (error) {

        console.error(
            "LIFETIME STATS ERROR:",
            error
        );

        return null;

    }

}


// ============================================================
// DATABASE IMPORT
// ============================================================

import database from "../database/database.js";

function getDatabase() {

    return database;

}


// ============================================================
// FORMATTERS
// ============================================================

function formatChange(value) {

    if (
        value === undefined ||
        value === null ||
        Number.isNaN(Number(value))
    ) {

        return "N/A";

    }


    const number =
        Number(value);


    if (
        number > 0
    ) {

        return `+${number.toFixed(2)}`;

    }


    return number.toFixed(2);

}


function formatNumber(value) {

    if (
        value === undefined ||
        value === null ||
        Number.isNaN(Number(value))
    ) {

        return "0.00";

    }


    return Number(value).toFixed(2);

}