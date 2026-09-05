import {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

import {
    getUser,
    submitDrill,
    approveDrill,
    getDailyProgress,
    getDrill,
    getLastDrill,
    canSubmitDailyDrill
} from "../services/drillService.js";

import {
    validateKills,
    validatePercentage,
    isImageAttachment
} from "../utils/validation.js";

import { runOCR } from "../ocr/ocrService.js";
import { parseCodmStats } from "../ocr/codmParser.js";

import database from "../database/database.js";


// ============================================================
// TEMPORARY OCR SESSION STORAGE
// ============================================================

const pendingOCR = new Map();


// ============================================================
// DAILY LIMIT MESSAGE
// ============================================================

const DAILY_LIMIT_MESSAGE =
    "SON!? CALM DOWN ITS ALREADY 4/4 !";


// ============================================================
// /submit-drill
// ============================================================

export async function startSubmitDrill(interaction) {

    try {

        const userId = interaction.user.id;

        const user = getUser(userId);


        // ----------------------------------------------------
        // REGISTRATION CHECK
        // ----------------------------------------------------

        if (
            !user ||
            !user.primary_role ||
            !user.secondary_role
        ) {

            return await interaction.reply({
                content:
                    "? **PLEASE COMPLETE /SETUP-ROLES FIRST.**",
                ephemeral: true
            });

        }


        // ----------------------------------------------------
        // HARD DAILY 4/4 LIMIT
        //
        // IMPORTANT:
        // This check happens BEFORE OCR.
        // Therefore a 5th attempt:
        // - does not run OCR
        // - does not create an OCR session
        // - does not accept values
        // - does not create a drill
        // ----------------------------------------------------

        const dailyLimit =
            canSubmitDailyDrill(userId);

        if (
            !dailyLimit.allowed
        ) {

            return await interaction.reply({

                content:
                    DAILY_LIMIT_MESSAGE,

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // COMMAND OPTIONS
        // ----------------------------------------------------

        const screenshot =
            interaction.options.getAttachment(
                "screenshot"
            );

        const manualKills =
            interaction.options.getInteger(
                "total_kills"
            );

        const manualAccuracy =
            interaction.options.getNumber(
                "accuracy"
            );

        const manualHeadshotAccuracy =
            interaction.options.getNumber(
                "headshot_accuracy"
            );

        const drillType =
            interaction.options.getString(
                "drill_type"
            );


        // ----------------------------------------------------
        // SCREENSHOT VALIDATION
        // ----------------------------------------------------

        if (
            !screenshot ||
            !isImageAttachment(screenshot)
        ) {

            return await interaction.reply({

                content:
                    "? **PLEASE UPLOAD A VALID IMAGE SCREENSHOT.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // DRILL TYPE VALIDATION
        // ----------------------------------------------------

        if (
            drillType !== "PRIMARY" &&
            drillType !== "SECONDARY"
        ) {

            return await interaction.reply({

                content:
                    "? **DRILL TYPE MUST BE PRIMARY OR SECONDARY.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // GET PERMANENT GUN ROLE
        // ----------------------------------------------------

        const gunRole =
            drillType === "PRIMARY"
                ? user.primary_role
                : user.secondary_role;


        // ----------------------------------------------------
        // FULL MANUAL ENTRY
        // ----------------------------------------------------

        if (
            manualKills !== null &&
            manualAccuracy !== null &&
            manualHeadshotAccuracy !== null
        ) {

            if (
                !validateKills(manualKills)
            ) {

                return await interaction.reply({

                    content:
                        "? **TOTAL NUMBER OF KILLS MUST BE A VALID WHOLE NUMBER.**",

                    ephemeral:
                        true

                });

            }


            if (
                !validatePercentage(manualAccuracy)
            ) {

                return await interaction.reply({

                    content:
                        "? **ACCURACY MUST BE BETWEEN 0 AND 100.**",

                    ephemeral:
                        true

                });

            }


            if (
                !validatePercentage(
                    manualHeadshotAccuracy
                )
            ) {

                return await interaction.reply({

                    content:
                        "? **HEADSHOT ACCURACY MUST BE BETWEEN 0 AND 100.**",

                    ephemeral:
                        true

                });

            }


            return await createSubmission(

                interaction,

                {

                    userId,

                    screenshot,

                    drillType,

                    gunRole,

                    screenshotHash:
                        null,

                    totalKills:
                        manualKills,

                    accuracy:
                        manualAccuracy,

                    headshotAccuracy:
                        manualHeadshotAccuracy

                }

            );

        }


        // ----------------------------------------------------
        // OCR
        // ----------------------------------------------------

        await interaction.deferReply({
            ephemeral: true
        });


        await interaction.editReply({

            content:
                "?? **READING YOUR COD:M SCREENSHOT...**\n\n" +
                "Please wait..."

        });


        let stats;


        try {

            const ocrResult =
                await runOCR(
                    screenshot.url
                );


            stats =
                parseCodmStats(
                    ocrResult.text
                );


        } catch (error) {

            console.error(
                "COD:M OCR FAILED:",
                error
            );


            // ------------------------------------------------
            // OCR FAILED
            // ------------------------------------------------

            const token =
                createToken();


            pendingOCR.set(

                token,

                {

                    userId,

                    screenshot,

                    drillType,

                    gunRole

                }

            );


            const manualButton =
                new ButtonBuilder()

                    .setCustomId(
                        `drill_manual_ocr:${token}`
                    )

                    .setLabel(
                        "ENTER VALUES MANUALLY"
                    )

                    .setEmoji(
                        "??"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    );


            const row =
                new ActionRowBuilder()
                    .addComponents(
                        manualButton
                    );


            return await interaction.editReply({

                content:

                    "?? **I COULDN'T READ THE COD:M STATISTICS.**\n\n" +
                    "You can enter the values manually.",

                components: [
                    row
                ]

            });

        }


        // ----------------------------------------------------
        // OCR VALIDATION
        // ----------------------------------------------------

        if (
            !stats ||
            !validateKills(stats.kills) ||
            !validatePercentage(stats.accuracy) ||
            !validatePercentage(stats.headshotAccuracy)
        ) {

            const token =
                createToken();


            pendingOCR.set(

                token,

                {

                    userId,

                    screenshot,

                    drillType,

                    gunRole

                }

            );


            const manualButton =
                new ButtonBuilder()

                    .setCustomId(
                        `drill_manual_ocr:${token}`
                    )

                    .setLabel(
                        "ENTER VALUES MANUALLY"
                    )

                    .setEmoji(
                        "??"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    );


            const row =
                new ActionRowBuilder()
                    .addComponents(
                        manualButton
                    );


            return await interaction.editReply({

                content:

                    "?? **THE OCR VALUES COULD NOT BE VALIDATED.**\n\n" +
                    "You can enter the values manually.",

                components: [
                    row
                ]

            });

        }


        // ----------------------------------------------------
        // STORE OCR SESSION
        // ----------------------------------------------------

        const token =
            createToken();


        pendingOCR.set(

            token,

            {

                userId,

                screenshot,

                drillType,

                gunRole,

                screenshotHash:
                    ocrResult.screenshotHash,

                totalKills:
                    stats.kills,

                accuracy:
                    stats.accuracy,

                headshotAccuracy:
                    stats.headshotAccuracy

            }

        );


        // ----------------------------------------------------
        // OCR CONFIRMATION BUTTONS
        // ----------------------------------------------------

        const confirmButton =
            new ButtonBuilder()

                .setCustomId(
                    `drill_confirm_ocr:${token}`
                )

                .setLabel(
                    "CONFIRM"
                )

                .setEmoji(
                    "?"
                )

                .setStyle(
                    ButtonStyle.Success
                );


        const correctButton =
            new ButtonBuilder()

                .setCustomId(
                    `drill_correct_ocr:${token}`
                )

                .setLabel(
                    "CORRECT VALUES"
                )

                .setEmoji(
                    "??"
                )

                .setStyle(
                    ButtonStyle.Primary
                );


        const cancelButton =
            new ButtonBuilder()

                .setCustomId(
                    `drill_cancel_ocr:${token}`
                )

                .setLabel(
                    "CANCEL"
                )

                .setEmoji(
                    "?"
                )

                .setStyle(
                    ButtonStyle.Danger
                );


        const row =
            new ActionRowBuilder()
                .addComponents(
                    confirmButton,
                    correctButton,
                    cancelButton
                );


        // ----------------------------------------------------
        // SHOW OCR RESULTS
        // ----------------------------------------------------

        return await interaction.editReply({

            content:

                "?? **OCR COMPLETE**\n\n" +

                `?? **Kills:** ${stats.kills}\n` +

                `?? **Accuracy:** ${Number(
                    stats.accuracy
                ).toFixed(2)}%\n` +

                `?? **Headshot Accuracy:** ${Number(
                    stats.headshotAccuracy
                ).toFixed(2)}%\n\n` +

                "**Are these values correct?**",

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
                    "? **AN ERROR OCCURRED WHILE PROCESSING YOUR DRILL.**",

                ephemeral:
                    true

            });

        }

    }

}


// ============================================================
// OCR BUTTON HANDLER
// ============================================================

export async function handleOCRButton(interaction) {

    try {

        const parts =
            interaction.customId.split(":");


        const action =
            parts[0];


        const token =
            parts[1];


        const data =
            pendingOCR.get(token);


        if (!data) {

            return await interaction.reply({

                content:
                    "? **THIS OCR SESSION HAS EXPIRED. PLEASE SUBMIT THE SCREENSHOT AGAIN.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // SECURITY
        // ----------------------------------------------------

        if (
            interaction.user.id !== data.userId
        ) {

            return await interaction.reply({

                content:
                    "? **THIS OCR SESSION BELONGS TO ANOTHER PLAYER.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // SECOND DAILY LIMIT CHECK
        //
        // Protects against a player leaving the OCR session
        // open while completing other drills.
        // ----------------------------------------------------

        const dailyLimit =
            canSubmitDailyDrill(
                data.userId
            );


        if (
            !dailyLimit.allowed
        ) {

            pendingOCR.delete(token);


            return await interaction.update({

                content:
                    DAILY_LIMIT_MESSAGE,

                components:
                    []

            });

        }


        // ----------------------------------------------------
        // CANCEL
        // ----------------------------------------------------

        if (
            action === "drill_cancel_ocr"
        ) {

            pendingOCR.delete(token);


            return await interaction.update({

                content:
                    "? **DRILL SUBMISSION CANCELLED.**",

                components:
                    []

            });

        }


        // ----------------------------------------------------
        // CONFIRM OCR
        // ----------------------------------------------------

        if (
            action === "drill_confirm_ocr"
        ) {

            pendingOCR.delete(token);


            await interaction.update({

                content:
                    "? **VALUES CONFIRMED. SAVING YOUR DRILL...**",

                components:
                    []

            });


            return await createSubmission(

                interaction,

                data

            );

        }


        // ----------------------------------------------------
        // CORRECT OCR VALUES
        // ----------------------------------------------------

        if (
            action === "drill_correct_ocr"
        ) {

            const modal =
                new ModalBuilder()

                    .setCustomId(
                        `drill_correct_modal:${token}`
                    )

                    .setTitle(
                        "Correct COD:M Statistics"
                    );


            const killsInput =
                new TextInputBuilder()

                    .setCustomId(
                        "kills"
                    )

                    .setLabel(
                        "Total Kills"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setPlaceholder(
                        String(
                            data.totalKills
                        )
                    )

                    .setRequired(
                        true
                    );


            const accuracyInput =
                new TextInputBuilder()

                    .setCustomId(
                        "accuracy"
                    )

                    .setLabel(
                        "Accuracy (%)"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setPlaceholder(
                        String(
                            data.accuracy
                        )
                    )

                    .setRequired(
                        true
                    );


            const headshotInput =
                new TextInputBuilder()

                    .setCustomId(
                        "headshot_accuracy"
                    )

                    .setLabel(
                        "Headshot Accuracy (%)"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setPlaceholder(
                        String(
                            data.headshotAccuracy
                        )
                    )

                    .setRequired(
                        true
                    );


            modal.addComponents(

                new ActionRowBuilder()
                    .addComponents(
                        killsInput
                    ),

                new ActionRowBuilder()
                    .addComponents(
                        accuracyInput
                    ),

                new ActionRowBuilder()
                    .addComponents(
                        headshotInput
                    )

            );


            return await interaction.showModal(
                modal
            );

        }


        // ----------------------------------------------------
        // MANUAL OCR ENTRY
        // ----------------------------------------------------

        if (
            action === "drill_manual_ocr"
        ) {

            const modal =
                new ModalBuilder()

                    .setCustomId(
                        `drill_manual_modal:${token}`
                    )

                    .setTitle(
                        "Enter COD:M Statistics"
                    );


            const killsInput =
                new TextInputBuilder()

                    .setCustomId(
                        "kills"
                    )

                    .setLabel(
                        "Total Kills"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setRequired(
                        true
                    );


            const accuracyInput =
                new TextInputBuilder()

                    .setCustomId(
                        "accuracy"
                    )

                    .setLabel(
                        "Accuracy (%)"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setRequired(
                        true
                    );


            const headshotInput =
                new TextInputBuilder()

                    .setCustomId(
                        "headshot_accuracy"
                    )

                    .setLabel(
                        "Headshot Accuracy (%)"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setRequired(
                        true
                    );


            modal.addComponents(

                new ActionRowBuilder()
                    .addComponents(
                        killsInput
                    ),

                new ActionRowBuilder()
                    .addComponents(
                        accuracyInput
                    ),

                new ActionRowBuilder()
                    .addComponents(
                        headshotInput
                    )

            );


            return await interaction.showModal(
                modal
            );

        }


    } catch (error) {

        console.error(
            "OCR BUTTON ERROR:",
            error
        );

    }

}


// ============================================================
// OCR MODAL HANDLER
// ============================================================

export async function handleOCRModal(interaction) {

    try {

        const parts =
            interaction.customId.split(":");


        const action =
            parts[0];


        const token =
            parts[1];


        const data =
            pendingOCR.get(token);


        if (!data) {

            return await interaction.reply({

                content:
                    "? **THIS OCR SESSION HAS EXPIRED. PLEASE SUBMIT AGAIN.**",

                ephemeral:
                    true

            });

        }


        if (
            interaction.user.id !== data.userId
        ) {

            return await interaction.reply({

                content:
                    "? **THIS SUBMISSION BELONGS TO ANOTHER PLAYER.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // FINAL DAILY LIMIT CHECK
        // ----------------------------------------------------

        const dailyLimit =
            canSubmitDailyDrill(
                data.userId
            );


        if (
            !dailyLimit.allowed
        ) {

            pendingOCR.delete(token);


            return await interaction.reply({

                content:
                    DAILY_LIMIT_MESSAGE,

                ephemeral:
                    true

            });

        }


        const totalKills =
            Number(
                interaction.fields.getTextInputValue(
                    "kills"
                )
            );


        const accuracy =
            Number(
                interaction.fields.getTextInputValue(
                    "accuracy"
                )
            );


        const headshotAccuracy =
            Number(
                interaction.fields.getTextInputValue(
                    "headshot_accuracy"
                )
            );


        if (
            !validateKills(totalKills)
        ) {

            return await interaction.reply({

                content:
                    "? **TOTAL KILLS MUST BE A VALID WHOLE NUMBER.**",

                ephemeral:
                    true

            });

        }


        if (
            !validatePercentage(accuracy)
        ) {

            return await interaction.reply({

                content:
                    "? **ACCURACY MUST BE BETWEEN 0 AND 100.**",

                ephemeral:
                    true

            });

        }


        if (
            !validatePercentage(headshotAccuracy)
        ) {

            return await interaction.reply({

                content:
                    "? **HEADSHOT ACCURACY MUST BE BETWEEN 0 AND 100.**",

                ephemeral:
                    true

            });

        }


        pendingOCR.delete(token);


        return await createSubmission(

            interaction,

            {

                ...data,

                totalKills,

                accuracy,

                headshotAccuracy

            }

        );


    } catch (error) {

        console.error(
            "OCR MODAL ERROR:",
            error
        );


        if (
            !interaction.replied
        ) {

            return await interaction.reply({

                content:
                    "? **COULD NOT PROCESS THE VALUES.**",

                ephemeral:
                    true

            });

        }

    }

}


// ============================================================
// DATABASE SUBMISSION
// ============================================================

async function createSubmission(
    interaction,
    data
) {

    const {

        userId,

        screenshot,

        drillType,

        gunRole,

        totalKills,

        accuracy,

        headshotAccuracy

    } = data;


    // --------------------------------------------------------
    // FINAL APPLICATION-LEVEL DAILY LIMIT CHECK
    // --------------------------------------------------------

    const dailyLimit =
        canSubmitDailyDrill(
            userId
        );


    if (
        !dailyLimit.allowed
    ) {

        return await sendError(

            interaction,

            DAILY_LIMIT_MESSAGE

        );

    }


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
        !validateKills(totalKills)
    ) {

        return await sendError(

            interaction,

            "? **TOTAL NUMBER OF KILLS MUST BE A VALID WHOLE NUMBER.**"

        );

    }


    if (
        !validatePercentage(accuracy)
    ) {

        return await sendError(

            interaction,

            "? **ACCURACY MUST BE BETWEEN 0 AND 100.**"

        );

    }


    if (
        !validatePercentage(headshotAccuracy)
    ) {

        return await sendError(

            interaction,

            "? **HEADSHOT ACCURACY MUST BE BETWEEN 0 AND 100.**"

        );

    }


    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    const result =
        submitDrill({

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

            screenshotHash:
                data.screenshotHash,

            screenshotMessageId:
                null,

            screenshotChannelId:
                interaction.channelId

        });


    // --------------------------------------------------------
    // DATABASE ERRORS
    // --------------------------------------------------------

    if (
        !result ||
        !result.success
    ) {

        if (
            result?.reason === "DAILY_LIMIT"
        ) {

            return await sendError(

                interaction,

                DAILY_LIMIT_MESSAGE

            );

        }


        if (
            result?.reason === "DUPLICATE"
        ) {

            return await sendError(

                interaction,

                "? **THIS DRILL HAS ALREADY BEEN SUBMITTED.**"

            );

        }


        if (
            result?.reason === "PRIMARY_LIMIT"
        ) {

            return await sendError(

                interaction,

                "? **YOU HAVE ALREADY REACHED YOUR PRIMARY DRILL LIMIT OF 2 FOR TODAY.**"

            );

        }


        if (
            result?.reason === "SECONDARY_LIMIT"
        ) {

            return await sendError(

                interaction,

                "? **YOU HAVE ALREADY REACHED YOUR SECONDARY DRILL LIMIT OF 2 FOR TODAY.**"

            );

        }


        return await sendError(

            interaction,

            "? **DRILL COULD NOT BE SUBMITTED.**"

        );

    }


    // --------------------------------------------------------
    // PREVIOUS DRILL
    // --------------------------------------------------------

    const previous =
        getLastDrill(userId);


    // --------------------------------------------------------
    // LIFETIME STATS
    // --------------------------------------------------------

    const lifetime =
        getLifetimeStatsLocal(userId);


    // --------------------------------------------------------
    // IMPROVEMENT
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // EMBED
    // --------------------------------------------------------

    const embed =
        new EmbedBuilder()

            .setTitle(
                "?? AIM DRILL SUBMISSION"
            )

            .setDescription(

                `**PLAYER:** <@${userId}>\n` +

                `**DRILL TYPE:** ${drillType}\n` +

                `**GUN ROLE:** ${gunRole}\n` +

                `**STATUS:** ? PENDING APPROVAL`

            )

            .addFields(

                {

                    name:
                        "?? TOTAL KILLS",

                    value:
                        `${totalKills}`,

                    inline:
                        true

                },

                {

                    name:
                        "?? ACCURACY",

                    value:
                        `${Number(
                            accuracy
                        ).toFixed(2)}%`,

                    inline:
                        true

                },

                {

                    name:
                        "?? HEADSHOT ACCURACY",

                    value:
                        `${Number(
                            headshotAccuracy
                        ).toFixed(2)}%`,

                    inline:
                        true

                }

            )

            .setImage(
                screenshot.url
            );


    // --------------------------------------------------------
    // CHANGE FROM LAST DRILL
    // --------------------------------------------------------

    if (
        previous &&
        improvement
    ) {

        embed.addFields({

            name:
                "?? CHANGE FROM LAST APPROVED DRILL",

            value:

                `Kills: ${formatChange(
                    improvement.kills
                )}\n` +

                `Accuracy: ${formatChange(
                    improvement.accuracy
                )}\n` +

                `Headshot Accuracy: ${formatChange(
                    improvement.headshotAccuracy
                )}`,

            inline:
                false

        });

    } else {

        embed.addFields({

            name:
                "?? CHANGE FROM LAST APPROVED DRILL",

            value:
                "This is your first approved drill.",

            inline:
                false

        });

    }


    // --------------------------------------------------------
    // LIFETIME
    // --------------------------------------------------------

    if (
        lifetime
    ) {

        embed.addFields({

            name:
                "?? LIFETIME AVERAGES",

            value:

                `Kills: ${formatNumber(
                    lifetime.avgKills
                )}\n` +

                `Accuracy: ${formatNumber(
                    lifetime.avgAccuracy
                )}%\n` +

                `Headshot Accuracy: ${formatNumber(
                    lifetime.avgHeadshotAccuracy
                )}%`,

            inline:
                false

        });

    }


    // --------------------------------------------------------
    // APPROVAL BUTTON
    // --------------------------------------------------------

    const approveButton =
        new ButtonBuilder()

            .setCustomId(
                `drill_approve:${result.drillId}:${userId}`
            )

            .setLabel(
                "APPROVE DRILL"
            )

            .setEmoji(
                "?"
            )

            .setStyle(
                ButtonStyle.Success
            );


    const row =
        new ActionRowBuilder()
            .addComponents(
                approveButton
            );


    // --------------------------------------------------------
    // PUBLIC MESSAGE
    // --------------------------------------------------------

    let message;

    try {

        message =
            await interaction.channel.send({

                embeds: [
                    embed
                ],

                components: [
                    row
                ]

            });

    } catch (error) {

        console.error(
            "PUBLIC DRILL MESSAGE ERROR:",
            error
        );

        return await sendError(

            interaction,

            "? **DRILL WAS SAVED, BUT THE PUBLIC RESULT MESSAGE COULD NOT BE CREATED. PLEASE CONTACT AN ADMIN.**"

        );

    }


    // --------------------------------------------------------
    // SAVE PUBLIC MESSAGE ID
    //
    // Required later by /delete-uploaded-data.
    // --------------------------------------------------------

    try {

        database.prepare(`

            UPDATE drills

            SET
                screenshot_message_id = ?,
                screenshot_channel_id = ?

            WHERE id = ?

        `).run(

            String(message.id),

            String(message.channelId),

            result.drillId

        );

    } catch (error) {

        console.error(
            "FAILED TO SAVE PUBLIC DRILL MESSAGE ID:",
            error
        );

    }


    // --------------------------------------------------------
    // ACKNOWLEDGE INTERACTION
    // --------------------------------------------------------

    if (
        interaction.deferred &&
        !interaction.replied
    ) {

        await interaction.editReply({

            content:
                "? **YOUR DRILL HAS BEEN SUBMITTED FOR APPROVAL.**",

            components:
                []

        });

    } else if (
        !interaction.replied
    ) {

        await interaction.reply({

            content:
                "? **YOUR DRILL HAS BEEN SUBMITTED FOR APPROVAL.**",

            ephemeral:
                true

        });

    }


    return message;

}


// ============================================================
// APPROVAL
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
        // SECURITY
        // ----------------------------------------------------

        if (
            interaction.user.id !== ownerId
        ) {

            return await interaction.reply({

                content:
                    "? **ONLY THE PLAYER WHO SUBMITTED THIS DRILL CAN APPROVE IT.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // APPROVE
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
                    "? **THIS DRILL COULD NOT BE APPROVED.**",

                ephemeral:
                    true

            });

        }


        const drill =
            getDrill(
                drillId
            );


        if (!drill) {

            return await interaction.reply({

                content:
                    "? **THE APPROVED DRILL COULD NOT BE FOUND.**",

                ephemeral:
                    true

            });

        }


        const progress =
            getDailyProgress(

                ownerId,

                drill.day_key

            );


        const approvedEmbed =
            new EmbedBuilder()

                .setTitle(
                    "?? AIM DRILL SUBMISSION"
                )

                .setDescription(

                    `**PLAYER:** <@${ownerId}>\n` +

                    `**DRILL TYPE:** ${drill.role_type}\n` +

                    `**GUN ROLE:** ${drill.gun_role}\n` +

                    `**STATUS:** ? APPROVED`

                )

                .addFields(

                    {

                        name:
                            "?? TOTAL KILLS",

                        value:
                            `${drill.kills}`,

                        inline:
                            true

                    },

                    {

                        name:
                            "?? ACCURACY",

                        value:
                            `${Number(
                                drill.accuracy
                            ).toFixed(2)}%`,

                        inline:
                            true

                    },

                    {

                        name:
                            "?? HEADSHOT ACCURACY",

                        value:
                            `${Number(
                                drill.headshot_accuracy
                            ).toFixed(2)}%`,

                        inline:
                            true

                    },

                    {

                        name:
                            "?? DAILY PROGRESS",

                        value:

                            `PRIMARY: ${progress.primary_count}/2\n` +

                            `SECONDARY: ${progress.secondary_count}/2\n` +

                            `TOTAL: ${progress.total_count}/4`,

                        inline:
                            false

                    }

                )

                .setImage(
                    drill.screenshot_url
                )

                .setFooter({

                    text:
                        `Drill ID: ${drillId} • APPROVED`

                });


        await interaction.update({

            embeds: [
                approvedEmbed
            ],

            components:
                []

        });


        // ----------------------------------------------------
        // NORMAL PROGRESS MESSAGE
        // ----------------------------------------------------

        if (
            progress.total_count < 4
        ) {

            return await interaction.followUp({

                content:

                    "? **UR DATA HAS BEEN SUCCESSFULLY IMPORTED AND STORED**\n\n" +

                    `?? PRIMARY: **${progress.primary_count}/2**\n` +

                    `?? SECONDARY: **${progress.secondary_count}/2**\n` +

                    `?? TOTAL: **${progress.total_count}/4**`

            });

        }


        // ----------------------------------------------------
        // 4/4 COMPLETE
        // ----------------------------------------------------

        return await interaction.followUp({

            content:

                `?? 4/4 DRILLS COMPLETE, <@${ownerId}>!\n` +

                "?? MISSION ACCOMPLISHED — YOU GAVE IT YOUR ALL TODAY!\n" +

                "?? KEEP GRINDING, AIM SHARP, AND COME BACK STRONGER TOMORROW!"

        });


    } catch (error) {

        console.error(
            "APPROVAL ERROR:",
            error
        );

    }

}


// ============================================================
// LIFETIME STATS
// ============================================================

function getLifetimeStatsLocal(discordId) {

    try {

        const row =
            database.prepare(`

                SELECT

                    (
                        COALESCE(archive.total_kills, 0)
                        +
                        COALESCE(current.total_kills, 0)
                    )
                    /
                    NULLIF(
                        COALESCE(archive.approved_count, 0)
                        +
                        COALESCE(current.approved_count, 0),
                        0
                    )
                    AS avgKills,

                    (
                        COALESCE(archive.total_accuracy, 0)
                        +
                        COALESCE(current.total_accuracy, 0)
                    )
                    /
                    NULLIF(
                        COALESCE(archive.approved_count, 0)
                        +
                        COALESCE(current.approved_count, 0),
                        0
                    )
                    AS avgAccuracy,

                    (
                        COALESCE(archive.total_headshot_accuracy, 0)
                        +
                        COALESCE(current.total_headshot_accuracy, 0)
                    )
                    /
                    NULLIF(
                        COALESCE(archive.approved_count, 0)
                        +
                        COALESCE(current.approved_count, 0),
                        0
                    )
                    AS avgHeadshotAccuracy,

                    (
                        COALESCE(archive.approved_count, 0)
                        +
                        COALESCE(current.approved_count, 0)
                    )
                    AS totalDrills

                FROM users

                LEFT JOIN lifetime_drill_stats AS archive

                    ON archive.discord_id =
                        users.discord_id

                LEFT JOIN (

                    SELECT

                        discord_id,

                        COUNT(*) AS approved_count,

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

                    WHERE status =
                        'APPROVED'

                    GROUP BY
                        discord_id

                ) AS current

                    ON current.discord_id =
                        users.discord_id

                WHERE users.discord_id = ?

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


async function sendError(
    interaction,
    message
) {

    if (
        interaction.deferred &&
        !interaction.replied
    ) {

        return await interaction.editReply({

            content:
                message,

            components:
                []

        });

    }


    if (
        interaction.replied
    ) {

        return await interaction.followUp({

            content:
                message,

            ephemeral:
                true

        });

    }


    return await interaction.reply({

        content:
            message,

        ephemeral:
            true

    });

}


// ============================================================
// TOKEN
// ============================================================

function createToken() {

    return (

        `${Date.now()}_` +

        Math.random()
            .toString(36)
            .slice(2, 10)

    );

}


// ============================================================
// FORMAT
// ============================================================

function formatChange(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "N/A";

    }


    if (
        number > 0
    ) {

        return `+${number.toFixed(2)}`;

    }


    return number.toFixed(2);

}


function formatNumber(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "0.00";

    }


    return number.toFixed(2);

}
