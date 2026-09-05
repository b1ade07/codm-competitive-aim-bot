import {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} from "discord.js";

import {
    getUser,
    registerRoles
} from "../services/drillService.js";


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
// /setup-roles
// ============================================================

export async function handleSetupRoles(interaction) {

    try {

        const userId =
            interaction.user.id;


        // ----------------------------------------------------
        // CHECK EXISTING REGISTRATION
        // ----------------------------------------------------

        const existingUser =
            getUser(userId);


        if (
            existingUser &&
            existingUser.primary_role &&
            existingUser.secondary_role
        ) {

            return await interaction.reply({

                content:
                    "🔒 **THESE ROLES ARE PERMANENT AND CANNOT BE CHANGED.**",

                ephemeral: true

            });

        }


        // ----------------------------------------------------
        // PRIMARY MENU
        // ----------------------------------------------------

        const primaryMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `primary_role_select:${userId}`
                )

                .setPlaceholder(
                    "SELECT YOUR PRIMARY GUN ROLE"
                )

                .addOptions(

                    PRIMARY_GUNS.map(gun => ({

                        label:
                            gun,

                        value:
                            gun,

                        description:
                            `Register ${gun} as your Primary gun role.`

                    }))

                );


        const row =
            new ActionRowBuilder()
                .addComponents(
                    primaryMenu
                );


        // ----------------------------------------------------
        // EMBED
        // ----------------------------------------------------

        const embed =
            new EmbedBuilder()

                .setTitle(
                    "🎯 REGISTER YOUR GUN ROLES"
                )

                .setDescription(

                    "Select your **PRIMARY** gun role first.\n\n" +

                    "🔒 Your selection will be **PERMANENT**.\n" +

                    "🔒 You will not be able to change it later."

                );


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
            "SETUP ROLES ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({

                content:
                    "❌ **AN ERROR OCCURRED WHILE STARTING ROLE REGISTRATION.**",

                ephemeral: true

            });

        }

    }

}


// ============================================================
// PRIMARY ROLE SELECTION
// ============================================================

export async function handlePrimaryRole(interaction) {

    try {

        const parts =
            interaction.customId.split(":");


        const userId =
            parts[1];


        // ----------------------------------------------------
        // CHECK USER
        // ----------------------------------------------------

        if (
            interaction.user.id !== userId
        ) {

            return await interaction.reply({

                content:
                    "❌ **THIS ROLE SELECTION IS NOT FOR YOU.**",

                ephemeral: true

            });

        }


        const primary =
            interaction.values[0];


        // ----------------------------------------------------
        // SECONDARY OPTIONS
        //
        // Remove the Primary gun from Secondary.
        // ----------------------------------------------------

        const secondaryOptions =
            SECONDARY_GUNS

                .filter(
                    gun => gun !== primary
                )

                .map(gun => ({

                    label:
                        gun,

                    value:
                        gun,

                    description:
                        `Register ${gun} as your Secondary gun role.`

                }));


        // ----------------------------------------------------
        // SECONDARY MENU
        // ----------------------------------------------------

        const secondaryMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `secondary_role_select:${userId}:${primary}`
                )

                .setPlaceholder(
                    "SELECT YOUR SECONDARY GUN ROLE"
                )

                .addOptions(
                    secondaryOptions
                );


        const row =
            new ActionRowBuilder()
                .addComponents(
                    secondaryMenu
                );


        // ----------------------------------------------------
        // EMBED
        // ----------------------------------------------------

        const embed =
            new EmbedBuilder()

                .setTitle(
                    "🎯 SELECT YOUR SECONDARY GUN ROLE"
                )

                .setDescription(

                    `**PRIMARY:** ${primary}\n\n` +

                    `🔒 **${primary}** has been removed from the Secondary list.\n\n` +

                    "Select your **SECONDARY** gun role.\n\n" +

                    "🔒 Both selections will be **PERMANENT**."

                );


        return await interaction.update({

            embeds: [
                embed
            ],

            components: [
                row
            ]

        });

    } catch (error) {

        console.error(
            "PRIMARY ROLE ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({

                content:
                    "❌ **AN ERROR OCCURRED WHILE SELECTING YOUR PRIMARY ROLE.**",

                ephemeral: true

            });

        }

    }

}


// ============================================================
// SECONDARY ROLE SELECTION
// ============================================================

export async function handleSecondaryRole(interaction) {

    try {

        const parts =
            interaction.customId.split(":");


        const userId =
            parts[1];


        const primary =
            parts[2];


        // ----------------------------------------------------
        // CHECK USER
        // ----------------------------------------------------

        if (
            interaction.user.id !== userId
        ) {

            return await interaction.reply({

                content:
                    "❌ **THIS ROLE SELECTION IS NOT FOR YOU.**",

                ephemeral: true

            });

        }


        const secondary =
            interaction.values[0];


        // ----------------------------------------------------
        // EXTRA SAFETY CHECK
        // ----------------------------------------------------

        if (
            secondary === primary
        ) {

            return await interaction.reply({

                content:
                    "❌ **YOUR PRIMARY AND SECONDARY GUN ROLES MUST BE DIFFERENT.**",

                ephemeral: true

            });

        }


        // ----------------------------------------------------
        // CHECK IF ALREADY REGISTERED
        // ----------------------------------------------------

        const existingUser =
            getUser(userId);


        if (
            existingUser &&
            existingUser.primary_role &&
            existingUser.secondary_role
        ) {

            return await interaction.update({

                content:
                    "🔒 **THESE ROLES ARE PERMANENT AND CANNOT BE CHANGED.**",

                embeds: [],

                components: []

            });

        }


        // ----------------------------------------------------
        // REGISTER BOTH ROLES
        // ----------------------------------------------------

        const result =
            registerRoles(

                userId,

                interaction.user.username,

                primary,

                secondary

            );


        // ----------------------------------------------------
        // REGISTRATION FAILED
        // ----------------------------------------------------

        if (
            !result ||
            !result.success
        ) {

            if (
                result?.reason ===
                "ALREADY_REGISTERED"
            ) {

                return await interaction.update({

                    content:
                        "🔒 **THESE ROLES ARE PERMANENT AND CANNOT BE CHANGED.**",

                    embeds: [],

                    components: []

                });

            }


            return await interaction.update({

                content:
                    "❌ **YOUR GUN ROLES COULD NOT BE REGISTERED.**",

                embeds: [],

                components: []

            });

        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        const embed =
            new EmbedBuilder()

                .setTitle(
                    "🎯 GUN ROLES SUCCESSFULLY REGISTERED"
                )

                .setDescription(

                    `**PRIMARY:** ${primary}\n` +

                    `**SECONDARY:** ${secondary}\n\n` +

                    "🔒 Both roles are now **PERMANENT**.\n" +

                    "🔒 You cannot change them later."

                )

                .addFields({

                    name:
                        "🔥 KEEP GRINDING",

                    value:
                        "A FUTURE PRO IS IN THE MAKING. ALL THE BEST AND KEEP GRINDING!"

                });


        return await interaction.update({

            embeds: [
                embed
            ],

            components: []

        });

    } catch (error) {

        console.error(
            "SECONDARY ROLE ERROR:",
            error
        );


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            return await interaction.reply({

                content:
                    "❌ **AN ERROR OCCURRED WHILE REGISTERING YOUR GUN ROLES.**",

                ephemeral: true

            });

        }

    }

}

export async function handleAdminRegister(interaction) {
    try {
        const targetUser = interaction.options.getUser("user");
        const userId = targetUser.id;

        const existingUser = getUser(userId);

        if (
            existingUser &&
            existingUser.primary_role &&
            existingUser.secondary_role
        ) {
            return await interaction.reply({
                content:
                    "\uD83D\uDD12 **THESE ROLES ARE ALREADY REGISTERED AND CANNOT BE CHANGED.**",
                ephemeral: true
            });
        }

        const primaryMenu = new StringSelectMenuBuilder()
            .setCustomId(
                `admin_primary_role_select:${userId}:${interaction.user.id}`
            )
            .setPlaceholder("SELECT PRIMARY GUN ROLE")
            .addOptions(
                PRIMARY_GUNS.map(gun => ({
                    label: gun,
                    value: gun,
                    description: `Register ${gun} as Primary gun role.`
                }))
            );

        const row = new ActionRowBuilder().addComponents(primaryMenu);

        const embed = new EmbedBuilder()
            .setTitle("\uD83C\DFAF ADMIN GUN ROLE REGISTRATION")
            .setDescription(
                `Register permanent gun roles for **${targetUser.username}**.\n\n` +
                "Select the **PRIMARY** gun role first.\n\n" +
                "\uD83D\DD12 Both roles will be permanent."
            );

        return await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    } catch (error) {
        console.error("ADMIN REGISTER ERROR:", error);

        if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
                content:
                    "\u274C **AN ERROR OCCURRED WHILE STARTING ADMIN ROLE REGISTRATION.**",
                ephemeral: true
            });
        }
    }
}

export async function handleAdminPrimaryRole(interaction) {
    try {
        const parts = interaction.customId.split(":");
        const userId = parts[1];
        const adminId = parts[2];

        if (interaction.user.id !== adminId) {
            return await interaction.reply({
                content:
                    "\u274C **THIS ROLE SELECTION IS NOT FOR YOU.**",
                ephemeral: true
            });
        }

        const primary = interaction.values[0];

        const secondaryOptions = SECONDARY_GUNS
            .filter(gun => gun !== primary)
            .map(gun => ({
                label: gun,
                value: gun,
                description: `Register ${gun} as Secondary gun role.`
            }));

        const secondaryMenu = new StringSelectMenuBuilder()
            .setCustomId(
                `admin_secondary_role_select:${userId}:${adminId}:${primary}`
            )
            .setPlaceholder("SELECT SECONDARY GUN ROLE")
            .addOptions(secondaryOptions);

        const row = new ActionRowBuilder().addComponents(secondaryMenu);

        const embed = new EmbedBuilder()
            .setTitle("\uD83C\DFAF SELECT SECONDARY GUN ROLE")
            .setDescription(
                `**PRIMARY:** ${primary}\n\n` +
                `\uD83D\DD12 **${primary}** has been removed from the Secondary list.\n\n` +
                "Select the **SECONDARY** gun role."
            );

        return await interaction.update({
            embeds: [embed],
            components: [row]
        });
    } catch (error) {
        console.error("ADMIN PRIMARY ROLE ERROR:", error);

        if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
                content:
                    "\u274C **AN ERROR OCCURRED WHILE SELECTING THE PRIMARY ROLE.**",
                ephemeral: true
            });
        }
    }
}

export async function handleAdminSecondaryRole(interaction) {
    try {
        const parts = interaction.customId.split(":");
        const userId = parts[1];
        const adminId = parts[2];
        const primary = parts[3];

        if (interaction.user.id !== adminId) {
            return await interaction.reply({
                content:
                    "\u274C **THIS ROLE SELECTION IS NOT FOR YOU.**",
                ephemeral: true
            });
        }

        const secondary = interaction.values[0];

        if (secondary === primary) {
            return await interaction.reply({
                content:
                    "\u274C **PRIMARY AND SECONDARY GUN ROLES MUST BE DIFFERENT.**",
                ephemeral: true
            });
        }

        const existingUser = getUser(userId);

        if (
            existingUser &&
            existingUser.primary_role &&
            existingUser.secondary_role
        ) {
            return await interaction.update({
                content:
                    "\uD83D\DD12 **THESE ROLES ARE ALREADY REGISTERED AND CANNOT BE CHANGED.**",
                embeds: [],
                components: []
            });
        }

        const targetMember = await interaction.guild.members.fetch(userId);

        const result = registerRoles(
            userId,
            targetMember.user.username,
            primary,
            secondary
        );

        if (!result || !result.success) {
            if (result?.reason === "ALREADY_REGISTERED") {
                return await interaction.update({
                    content:
                        "\uD83D\DD12 **THESE ROLES ARE ALREADY REGISTERED AND CANNOT BE CHANGED.**",
                    embeds: [],
                    components: []
                });
            }

            return await interaction.update({
                content:
                    "\u274C **THE USER'S GUN ROLES COULD NOT BE REGISTERED.**",
                embeds: [],
                components: []
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("\u2705 ADMIN ROLE REGISTRATION COMPLETE")
            .setDescription(
                `**USER:** ${targetMember.user.username}\n` +
                `**PRIMARY:** ${primary}\n` +
                `**SECONDARY:** ${secondary}\n\n` +
                "\uD83D\DD12 Both roles are now **PERMANENT**."
            );

        return await interaction.update({
            embeds: [embed],
            components: []
        });
    } catch (error) {
        console.error("ADMIN SECONDARY ROLE ERROR:", error);

        if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
                content:
                    "\u274C **AN ERROR OCCURRED WHILE REGISTERING THE USER'S GUN ROLES.**",
                ephemeral: true
            });
        }
    }
}
