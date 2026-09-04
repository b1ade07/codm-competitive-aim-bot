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
**🎯 COD:M AIM DRILLS — COMMAND GUIDE**

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

\`/stats\`
View your lifetime AIM DRILLS statistics.

\`/today\`
View today's drill progress.

\`/streak\`
View your current and longest streak.

**DAILY TARGET**

Primary: **2 drills**
Secondary: **2 drills**
Total: **4 drills**

Daily cycle:
**03:00 AM IST → 03:00 AM IST**

Only approved drills count toward progress.
`;

            if (isAdmin) {

                message += `
**🔐 ADMIN COMMANDS**

\`/admin-approve\`
Approve a pending drill.

\`/admin-reject\`
Reject a pending drill.

\`/admin-user\`
View a player's stored information.

\`/admin-change-role\`
Change a registered player's Primary or Secondary gun role.
`;
            }

            return await interaction.reply({
                content: message
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
            command === "stats" ||
            command === "today" ||
            command === "streak"
        ) {

            if (
                interaction.channelId !==
                config.aimDrillsChannelId
            ) {

                return await interaction.reply({

                    content:
                        `THIS COMMAND CAN ONLY BE USED IN <#${config.aimDrillsChannelId}> 🎯`,

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
                        "❌ You do not have permission to use this command.",

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

            return await interaction.reply({

                content:
                    result?.message ||
                    (
                        result?.success
                            ? "✅ Drill approved successfully."
                            : "❌ Drill could not be approved."
                    ),

                ephemeral: true

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
                        "❌ You do not have permission to use this command.",

                    ephemeral: true

                });

            }

            const drillId =
                interaction.options.getInteger(
                    "drill_id"
                );

            const result =
                rejectDrill(
                    drillId,
                    interaction.user.id
                );

            return await interaction.reply({

                content:
                    result?.message ||
                    (
                        result?.success
                            ? "✅ Drill rejected successfully."
                            : "❌ Drill could not be rejected."
                    ),

                ephemeral: true

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
                        "❌ You do not have permission to use this command.",

                    ephemeral: true

                });

            }

            const member =
                interaction.options.getUser(
                    "member"
                );

            return await interaction.reply({

                content:
                    `ADMIN USER LOOKUP FOR <@${member.id}> IS CURRENTLY BEING CONNECTED TO THE DATABASE.`,

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
    // BUTTON INTERACTIONS
    // ========================================================

    if (interaction.isButton()) {

        // ----------------------------------------------------
        // OCR SUBMIT BUTTONS
        // ----------------------------------------------------

        if (
            interaction.customId.startsWith(
                "drill_confirm_ocr:"
            ) ||
            interaction.customId.startsWith(
                "drill_correct_ocr:"
            ) ||
            interaction.customId.startsWith(
                "drill_cancel_ocr:"
            ) ||
            interaction.customId.startsWith(
                "drill_manual_ocr:"
            )
        ) {

            return await handleOCRButton(
                interaction
            );

        }


        // ----------------------------------------------------
        // APPROVE DRILL
        // ----------------------------------------------------

        if (
            interaction.customId.startsWith(
                "drill_approve:"
            )
        ) {

            return await handleApproval(
                interaction
            );

        }

    }


    // ========================================================
    // MODAL INTERACTIONS
    // ========================================================

    if (interaction.isModalSubmit()) {

        if (
            interaction.customId.startsWith(
                "drill_correct_modal:"
            ) ||
            interaction.customId.startsWith(
                "drill_manual_modal:"
            )
        ) {

            return await handleOCRModal(
                interaction
            );

        }

    }


    // ========================================================
    // STRING SELECT MENUS
    // ========================================================

    if (interaction.isStringSelectMenu()) {

        if (
            interaction.customId.startsWith(
                "primary_role_select:"
            )
        ) {

            return await handlePrimaryRole(
                interaction
            );

        }


        if (
            interaction.customId.startsWith(
                "secondary_role_select:"
            )
        ) {

            return await handleSecondaryRole(
                interaction
            );

        }


        if (
            interaction.customId.startsWith(
                "leaderboard:"
            )
        ) {

            return await showLeaderboard(
                interaction,
                interaction.values[0]
            );

        }

    }

}
