import {
    SlashCommandBuilder,
    PermissionFlagsBits
} from "discord.js";


// ============================================================
// PUBLIC COMMANDS
// ============================================================

export const publicCommands = [

    // ----------------------------------------------------------
    // /commands
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("commands")

        .setDescription(
            "View all commands available to normal members."
        ),


    // ----------------------------------------------------------
    // /setup-roles
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("setup-roles")

        .setDescription(
            "Register your permanent Primary and Secondary gun roles."
        ),


    // ----------------------------------------------------------
    // /roles
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("roles")

        .setDescription(
            "View your registered gun roles."
        ),


    // ----------------------------------------------------------
    // /submit-drill
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("submit-drill")

        .setDescription(
            "Submit your AIM drill."
        )


        // SCREENSHOT
        .addAttachmentOption(option =>

            option

                .setName("screenshot")

                .setDescription(
                    "Upload your AIM drill screenshot."
                )

                .setRequired(true)

        )


        // DRILL TYPE
        //
        // IMPORTANT:
        // Required options must come before optional options.

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


        // OPTIONAL MANUAL KILLS
        //
        // Normally leave this blank.
        // OCR will read the screenshot automatically.

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


        // OPTIONAL MANUAL ACCURACY

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


        // OPTIONAL MANUAL HEADSHOT ACCURACY

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


    // ----------------------------------------------------------
    // /leaderboard
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("leaderboard")

        .setDescription(
            "View the lifetime AIM DRILLS leaderboard."
        ),


    // ----------------------------------------------------------
    // /stats
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("stats")

        .setDescription(
            "View your lifetime AIM DRILLS statistics."
        ),


    // ----------------------------------------------------------
    // /today
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("today")

        .setDescription(
            "View your current daily AIM DRILLS progress."
        ),


    // ----------------------------------------------------------
    // /streak
    // ----------------------------------------------------------

    new SlashCommandBuilder()

        .setName("streak")

        .setDescription(
            "View your current and longest streak."
        )

];


// ============================================================
// ADMIN COMMANDS
// ============================================================

export const adminCommands = [

    // ----------------------------------------------------------
    // /admin-approve
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // /admin-reject
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // /admin-user
    // ----------------------------------------------------------

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
        )

];


// ============================================================
// ALL COMMANDS
// ============================================================

export const allCommands = [

    ...publicCommands,

    ...adminCommands

];