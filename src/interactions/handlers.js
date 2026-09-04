import {
    PermissionFlagsBits
} from "discord.js";

import { config } from "../config.js";

import {
    handleSetupRoles,
    handlePrimaryRole,
    handleSecondaryRole
} from "../commands/setupRoles.js";

import {
    showRoles
} from "../commands/roles.js";

import {
    startSubmitDrill,
    handleApproval,
    handleOCRButton,
    handleOCRModal
} from "./submitDrill.js";

import {
    startLeaderboard,
    showLeaderboard
} from "../commands/leaderboard.js";

import {
    startDrillsLeaderboard,
    showDrillsLeaderboard
} from "../commands/drillsLeaderboard.js";

import {
    showStats
} from "../commands/stats.js";

import {
    showToday
} from "../commands/today.js";

import {
    showStreak
} from "../commands/streak.js";

import {
    approveDrill,
    rejectDrill
} from "../services/drillService.js";

import {
    handleAdminChangeRole
} from "../commands/adminChangeRole.js";

import {
    handleDeleteUploadedData
} from "../commands/deleteUploadedData.js";


// ============================================================
// MAIN INTERACTION HANDLER
// ============================================================

export async function handleInteraction(
    interaction
) {

    // ========================================================
    // SLASH COMMANDS
    // ========================================================

    if (interaction.isChatInputCommand()) {

        const command =
            interaction.commandName;


        // ====================================================
        // /COMMANDS
        // ====================================================

        if (command === "commands") {

            const isAdmin =
                interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                );

            let message = `
**\u{1F3AF} COD:M AIM DRILLS — COMMAND GUIDE**

**NORMAL MEMBER COMMANDS**

\`/setup-roles\`
Register your permanent Primary and Secondary gun roles.

\`/roles\`
View your registered gun roles.

\`/submit-drill\`
Submit your AIM drill screenshot and manually enter:
• Total Number of Kills
• Accuracy
• Headshot Accuracy
• PRIMARY / SECONDARY

\`/leaderboard\`
View the lifetime AIM DRILLS leaderboard.

\`/drills-leaderboard\`
View Daily, Weekly, Monthly and Yearly drill counts.

\`/stats\`
View your lifetime AIM DRILLS statistics.

\`/today\`
View today's drill progress.

\`/streak\`
View your current and longest streak.

\`/delete-uploaded-data\`
Delete one of your own APPROVED drills using its specific Drill ID.

**DAILY TARGET**

Primary: **2 drills**
Secondary: **2 drills**
Total: **4 drills**

Daily cycle:
**03:00 AM IST \u{2192} 03:00 AM IST**

Only approved drills count toward progress.
`;

            if (isAdmin) {

                message += `

**ADMIN COMMANDS**

\`/admin-approve <drill_id>\`
Approve a pending drill.

\`/admin-reject <drill_id>\`
Reject a pending drill.

\`/admin-user <member>\`
View stored player information.

\`/admin-change-role <member> <role_type> <gun_role>\`
Correct a player's permanent Primary or Secondary gun role.
`;

            }

            return await interaction.reply({
                content: message,
                ephemeral: true
            });

        }


        // ====================================================
        // /SETUP-ROLES
        // ====================================================

        if (command === "setup-roles") {

            return await handleSetupRoles(
                interaction
            );

        }


        // ====================================================
        // /ROLES
        // ====================================================

        if (command === "roles") {

            return await showRoles(
                interaction
            );

        }


        // ====================================================
        // AIM DRILLS CHANNEL CHECK
        // ====================================================

        if (
            command === "submit-drill" ||
            command === "leaderboard" ||
            command === "drills-leaderboard" ||
            command === "stats" ||
            command === "today" ||
            command === "streak" ||
            command === "delete-uploaded-data"
        ) {

            if (
                interaction.channelId !==
                config.aimDrillsChannelId
            ) {

                return await interaction.reply({

                    content:
                        `THIS COMMAND CAN ONLY BE USED IN <#${config.aimDrillsChannelId}> ??`,

                    ephemeral: true

                });

            }

        }


        // ====================================================
        // /SUBMIT-DRILL
        // ====================================================

        if (command === "submit-drill") {

            return await startSubmitDrill(
                interaction
            );

        }


        // ====================================================
        // /LEADERBOARD
        // ====================================================

        if (command === "leaderboard") {

            return await startLeaderboard(
                interaction
            );

        }


        // ====================================================
        // /DRILLS-LEADERBOARD
        // ====================================================

        if (command === "drills-leaderboard") {

            return await startDrillsLeaderboard(
                interaction
            );

        }


        // ====================================================
        // /STATS
        // ====================================================

        if (command === "stats") {

            return await showStats(
                interaction
            );

        }


        // ====================================================
        // /TODAY
        // ====================================================

        if (command === "today") {

            return await showToday(
                interaction
            );

        }


        // ====================================================
        // /STREAK
        // ====================================================

        if (command === "streak") {

            return await showStreak(
                interaction
            );

        }


        // ====================================================
        // /DELETE-UPLOADED-DATA
        // ====================================================

        if (command === "delete-uploaded-data") {

            return await handleDeleteUploadedData(
                interaction
            );

        }


        // ====================================================
        // ADMIN APPROVE
        // ====================================================

        if (command === "admin-approve") {

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {

                return await interaction.reply({
                    content:
                        "? Administrator permission required.",
                    ephemeral: true
                });

            }

            const drillId =
                interaction.options.getInteger(
                    "drill_id"
                );

            const result =
                approveDrill(
                    drillId,
                    interaction.user.id
                );

            if (!result.success) {

                return await interaction.reply({
                    content:
                        `? Could not approve Drill ID **${drillId}**.\nReason: **${result.reason}**`,
                    ephemeral: true
                });

            }

            return await interaction.reply({
                content:
                    `? Drill ID **${drillId}** has been approved.`,
                ephemeral: false
            });

        }


        // ====================================================
        // ADMIN REJECT
        // ====================================================

        if (command === "admin-reject") {

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {

                return await interaction.reply({
                    content:
                        "? Administrator permission required.",
                    ephemeral: true
                });

            }

            const drillId =
                interaction.options.getInteger(
                    "drill_id"
                );

            const reason =
                interaction.options.getString(
                    "reason"
                );

            const result =
                rejectDrill(
                    drillId,
                    interaction.user.id
                );

            if (!result.success) {

                return await interaction.reply({
                    content:
                        `? Could not reject Drill ID **${drillId}**.\nReason: **${result.reason}**`,
                    ephemeral: true
                });

            }

            return await interaction.reply({
                content:
                    `? Drill ID **${drillId}** rejected.` +
                    (
                        reason
                            ? `\nReason: ${reason}`
                            : ""
                    ),
                ephemeral: false
            });

        }


        // ====================================================
        // ADMIN USER
        // ====================================================

        if (command === "admin-user") {

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {

                return await interaction.reply({
                    content:
                        "? Administrator permission required.",
                    ephemeral: true
                });

            }

            const member =
                interaction.options.getUser(
                    "member"
                );

            const user =
                interaction.client.users.cache.get(
                    member.id
                );

            const stored =
                (await import("../services/drillService.js"))
                    .getUser(member.id);

            if (!stored) {

                return await interaction.reply({
                    content:
                        `? No registered data found for ${member}.`,
                    ephemeral: true
                });

            }

            return await interaction.reply({
                content:
                    `?? **${user?.tag || member.tag}**\n\n` +
                    `Primary: **${stored.primary_role || "Not set"}**\n` +
                    `Secondary: **${stored.secondary_role || "Not set"}**\n` +
                    `Registered: **${stored.registered_at || "Not available"}**\n` +
                    `Current Streak: **${stored.current_streak || 0}**\n` +
                    `Longest Streak: **${stored.longest_streak || 0}**\n` +
                    `Last Completed Day: **${stored.last_completed_day || "None"}**`,
                ephemeral: true
            });

        }


        // ====================================================
        // ADMIN CHANGE ROLE
        // ====================================================

        if (command === "admin-change-role") {

            return await handleAdminChangeRole(
                interaction
            );

        }

    }


    // ========================================================
    // BUTTONS
    // ========================================================

    if (interaction.isButton()) {

        const customId =
            interaction.customId;


        // ====================================================
        // OCR BUTTONS
        // ====================================================

        if (
            customId.startsWith("drill_confirm_ocr:") ||
            customId.startsWith("drill_correct_ocr:") ||
            customId.startsWith("drill_cancel_ocr:") ||
            customId.startsWith("drill_manual_ocr:")
        ) {

            return await handleOCRButton(
                interaction
            );

        }


        // ====================================================
        // APPROVAL BUTTON
        // ====================================================

        if (
            customId.startsWith("drill_approve:")
        ) {

            return await handleApproval(
                interaction
            );

        }

    }


    // ========================================================
    // MODALS
    // ========================================================

    if (interaction.isModalSubmit()) {

        const customId =
            interaction.customId;


        // ====================================================
        // OCR CORRECTION / MANUAL MODALS
        // ====================================================

        if (
            customId.startsWith("drill_correct_modal:") ||
            customId.startsWith("drill_manual_modal:")
        ) {

            return await handleOCRModal(
                interaction
            );

        }

    }

    // ========================================================
    // STRING SELECT MENUS
    // ========================================================

    if (
        interaction.isStringSelectMenu()
    ) {

        const customId =
            interaction.customId;


        // ====================================================
        // PRIMARY ROLE
        // ====================================================

        if (
            customId.startsWith(
                "primary_role_select:"
            )
        ) {

            return await handlePrimaryRole(
                interaction
            );

        }


        // ====================================================
        // SECONDARY ROLE
        // ====================================================

        if (
            customId.startsWith(
                "secondary_role_select:"
            )
        ) {

            return await handleSecondaryRole(
                interaction
            );

        }



        // ====================================================
        // LIFETIME LEADERBOARD
        // ====================================================

        if (
            customId.startsWith(
                "leaderboard:"
            )
        ) {

            const category =
                interaction.values[0];

            return await showLeaderboard(
                interaction,
                category
            );

        }



        // ====================================================
        // DRILLS LEADERBOARD
        // ====================================================

        if (
            customId.startsWith(
                "drills-leaderboard:"
            )
        ) {

            const period =
                interaction.values[0];

            return await showDrillsLeaderboard(
                interaction,
                period
            );

        }

    }

}
