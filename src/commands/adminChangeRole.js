import {
    PermissionFlagsBits
} from "discord.js";

import database from "../database/database.js";


// ============================================================
// ALLOWED GUN ROLES
// ============================================================

const PRIMARY_GUNS = [
    "AR",
    "SMG"
];

const SECONDARY_GUNS = [
    "AR",
    "SMG",
    "LMG",
    "SHOTGUN",
    "MARKSMAN",
    "SNIPER",
    "PISTOL"
];


// ============================================================
// /admin-change-role
// ============================================================

export async function handleAdminChangeRole(interaction) {

    try {

        // ----------------------------------------------------
        // ADMIN SECURITY
        // ----------------------------------------------------

        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return await interaction.reply({

                content:
                    "❌ You do not have permission to use this command.",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // GET OPTIONS
        // ----------------------------------------------------

        const member =
            interaction.options.getUser(
                "member"
            );

        const roleType =
            interaction.options.getString(
                "role_type"
            );

        const gunRole =
            interaction.options.getString(
                "gun_role"
            );


        // ----------------------------------------------------
        // VALIDATE MEMBER
        // ----------------------------------------------------

        if (!member) {

            return await interaction.reply({

                content:
                    "❌ **PLAYER COULD NOT BE FOUND.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // VALIDATE ROLE TYPE
        // ----------------------------------------------------

        if (
            roleType !== "PRIMARY" &&
            roleType !== "SECONDARY"
        ) {

            return await interaction.reply({

                content:
                    "❌ **ROLE TYPE MUST BE PRIMARY OR SECONDARY.**",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // VALIDATE GUN ROLE
        // ----------------------------------------------------

        const allowedGuns =
            roleType === "PRIMARY"
                ? PRIMARY_GUNS
                : SECONDARY_GUNS;


        if (
            !allowedGuns.includes(gunRole)
        ) {

            return await interaction.reply({

                content:

                    `❌ **${gunRole} IS NOT A VALID ${roleType} GUN ROLE.**\n\n` +

                    `Allowed ${roleType} roles: ${allowedGuns.join(", ")}`,

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // FIND REGISTERED USER
        // ----------------------------------------------------

        const existingUser =
            database.prepare(`

                SELECT
                    discord_id,
                    username,
                    primary_role,
                    secondary_role

                FROM users

                WHERE discord_id = ?

            `).get(
                member.id
            );


        if (!existingUser) {

            return await interaction.reply({

                content:

                    `❌ **<@${member.id}> IS NOT REGISTERED WITH THE AIM DRILLS BOT.**\n\n` +

                    "The player must complete `/setup-roles` first.",

                ephemeral:
                    true

            });

        }


        // ----------------------------------------------------
        // UPDATE ONLY THE REQUESTED ROLE
        // ----------------------------------------------------

        if (
            roleType === "PRIMARY"
        ) {

            database.prepare(`

                UPDATE users

                SET primary_role = ?

                WHERE discord_id = ?

            `).run(

                gunRole,

                member.id

            );

        } else {

            database.prepare(`

                UPDATE users

                SET secondary_role = ?

                WHERE discord_id = ?

            `).run(

                gunRole,

                member.id

            );

        }


        // ----------------------------------------------------
        // PUBLIC CONFIRMATION
        // ----------------------------------------------------

        const updatedUser =
            database.prepare(`

                SELECT
                    username,
                    primary_role,
                    secondary_role

                FROM users

                WHERE discord_id = ?

            `).get(
                member.id
            );


        return await interaction.reply({

            content:

                `🔧 **ADMIN ROLE CHANGE COMPLETED**\n\n` +

                `👤 **PLAYER:** <@${member.id}> (${member.tag})\n` +

                `🎯 **ROLE CHANGED:** ${roleType}\n` +

                `🔫 **NEW GUN ROLE:** ${gunRole}\n\n` +

                `📌 **CURRENT PRIMARY:** ${updatedUser.primary_role || "Not set"}\n` +

                `📌 **CURRENT SECONDARY:** ${updatedUser.secondary_role || "Not set"}\n\n` +

                `👮 **CHANGED BY:** ${interaction.user} (${interaction.user.tag})`

        });

    } catch (error) {

        console.error(
            "ADMIN CHANGE ROLE ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({

                content:
                    "❌ **AN ERROR OCCURRED WHILE CHANGING THE PLAYER ROLE.**",

                ephemeral:
                    true

            });

        }

    }

}
