import {
    SlashCommandBuilder,
    PermissionFlagsBits
} from "discord.js";


// ============================================================
// PUBLIC COMMANDS
// ============================================================

export const publicCommands = [

    new SlashCommandBuilder()
        .setName("commands")
        .setDescription(
            "View all commands available to normal members."
        ),


    new SlashCommandBuilder()
        .setName("setup-roles")
        .setDescription(
            "Register your permanent Primary and Secondary gun roles."
        ),


    new SlashCommandBuilder()
        .setName("roles")
        .setDescription(
            "View your registered gun roles."
        ),


    new SlashCommandBuilder()
        .setName("submit-drill")
        .setDescription(
            "Submit your AIM drill."
        )

        .addAttachmentOption(option =>
            option
                .setName("screenshot")
                .setDescription(
                    "Upload your AIM drill screenshot."
                )
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("drill_type")
                .setDescription(
                    "Select PRIMARY or SECONDARY."
                )
                .setRequired(true)
                .addChoices(
                    {
                        name: "PRIMARY",
                        value: "PRIMARY"
                    },
                    {
                        name: "SECONDARY",
                        value: "SECONDARY"
                    }
                )
        )

        .addIntegerOption(option =>
            option
                .setName("total_kills")
                .setDescription(
                    "Optional: manually enter total kills."
                )
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(9999)
        )

        .addNumberOption(option =>
            option
                .setName("accuracy")
                .setDescription(
                    "Optional: manually enter accuracy percentage."
                )
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(100)
        )

        .addNumberOption(option =>
            option
                .setName("headshot_accuracy")
                .setDescription(
                    "Optional: manually enter headshot accuracy percentage."
                )
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(100)
        ),


    new SlashCommandBuilder()
        .setName("peak-drill")
        .setDescription(
            "View your peak AIM DRILLS performance for the current year."
        ),


    new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription(
            "View the lifetime AIM DRILLS leaderboard."
        ),


    new SlashCommandBuilder()
        .setName("drills-leaderboard")
        .setDescription(
            "View the Daily, Weekly, Monthly and Yearly drill leaderboard."
        ),


    new SlashCommandBuilder()
        .setName("stats")
        .setDescription(
            "View your lifetime AIM DRILLS statistics."
        ),


    new SlashCommandBuilder()
        .setName("today")
        .setDescription(
            "View your current daily AIM DRILLS progress."
        ),


    new SlashCommandBuilder()
        .setName("streak")
        .setDescription(
            "View your current and longest streak."
        ),


    // ----------------------------------------------------------
    // /delete-uploaded-data
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("delete-uploaded-data")

        .setDescription(
            "Delete one of your own approved AIM drill uploads."
        )

        .addIntegerOption(option =>

            option

                .setName("drill_id")

                .setDescription(
                    "The specific approved Drill ID to delete."
                )

                .setRequired(true)

                .setMinValue(1)

        )

];


// ============================================================
// ADMIN COMMANDS
// ============================================================

export const adminCommands = [

    new SlashCommandBuilder()
        .setName("admin-delete-uploaded-data")
        .setDescription("Admin: delete any user's approved AIM drill upload.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option
                .setName("drill_id")
                .setDescription("The specific approved Drill ID to delete.")
                .setRequired(true)
                .setMinValue(1)
        ),


    new SlashCommandBuilder()
        .setName("admin-approve")
        .setDescription(
            "Approve a pending drill."
        )
        .addIntegerOption(option =>
            option
                .setName("drill_id")
                .setDescription(
                    "The drill ID to approve."
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),


    new SlashCommandBuilder()
        .setName("admin-reject")
        .setDescription(
            "Reject a pending drill."
        )
        .addIntegerOption(option =>
            option
                .setName("drill_id")
                .setDescription(
                    "The drill ID to reject."
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription(
                    "Reason for rejecting the drill."
                )
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),


    new SlashCommandBuilder()
        .setName("admin-user")
        .setDescription(
            "View a player's stored information."
        )
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription(
                    "Discord member."
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),


    // ----------------------------------------------------------
    // /admin-change-role
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("admin-change-role")

        .setDescription(
            "Change a registered player's Primary or Secondary gun role."
        )

        .addUserOption(option =>

            option

                .setName("member")

                .setDescription(
                    "Registered Discord player."
                )

                .setRequired(true)

        )

        .addStringOption(option =>

            option

                .setName("role_type")

                .setDescription(
                    "Select which permanent role to change."
                )

                .setRequired(true)

                .addChoices(

                    {
                        name: "PRIMARY",
                        value: "PRIMARY"
                    },

                    {
                        name: "SECONDARY",
                        value: "SECONDARY"
                    }

                )

        )

        .addStringOption(option =>

            option

                .setName("gun_role")

                .setDescription(
                    "New gun role."
                )

                .setRequired(true)

                .addChoices(

                    {
                        name: "AR",
                        value: "AR"
                    },

                    {
                        name: "SMG",
                        value: "SMG"
                    },

                    {
                        name: "LMG",
                        value: "LMG"
                    },

                    {
                        name: "SHOTGUN",
                        value: "SHOTGUN"
                    },

                    {
                        name: "MARKSMAN",
                        value: "MARKSMAN"
                    },

                    {
                        name: "SNIPER",
                        value: "SNIPER"
                    },

                    {
                        name: "PISTOL",
                        value: "PISTOL"
                    }

                )

        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )

];


// ============================================================
// ALL COMMANDS
// ============================================================

export const allCommands = [

    ...publicCommands,

    ...adminCommands

];
