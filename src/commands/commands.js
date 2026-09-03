import {
    SlashCommandBuilder,
    PermissionFlagsBits
} from "discord.js";

export const publicCommands = [
    new SlashCommandBuilder()
        .setName("commands")
        .setDescription("View all commands available to normal members."),

    new SlashCommandBuilder()
        .setName("setup-roles")
        .setDescription("Register your permanent Primary and Secondary gun roles."),

    new SlashCommandBuilder()
        .setName("roles")
        .setDescription("View your registered gun roles."),

    new SlashCommandBuilder()
        .setName("submit-drill")
        .setDescription("Submit your AIM drill.")

        .addAttachmentOption(option =>
            option
                .setName("screenshot")
                .setDescription("Upload your AIM drill screenshot.")
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName("total_kills")
                .setDescription("Enter Total Number of Kills.")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(9999)
        )

        .addNumberOption(option =>
            option
                .setName("accuracy")
                .setDescription("Enter Accuracy percentage.")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)
        )

        .addNumberOption(option =>
            option
                .setName("headshot_accuracy")
                .setDescription("Enter Headshot Accuracy percentage.")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)
        )

        .addStringOption(option =>
            option
                .setName("drill_type")
                .setDescription("Select PRIMARY or SECONDARY.")
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
        ),

    new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the lifetime AIM DRILLS leaderboard."),

    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("View your lifetime AIM DRILLS statistics."),

    new SlashCommandBuilder()
        .setName("today")
        .setDescription("View your current daily AIM DRILLS progress."),

    new SlashCommandBuilder()
        .setName("streak")
        .setDescription("View your current and longest streak.")
];

export const adminCommands = [
    new SlashCommandBuilder()
        .setName("admin-approve")
        .setDescription("Approve a pending drill.")
        .addIntegerOption(option =>
            option
                .setName("drill_id")
                .setDescription("The drill ID to approve.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    new SlashCommandBuilder()
        .setName("admin-reject")
        .setDescription("Reject a pending drill.")
        .addIntegerOption(option =>
            option
                .setName("drill_id")
                .setDescription("The drill ID to reject.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    new SlashCommandBuilder()
        .setName("admin-user")
        .setDescription("View a player's stored information.")
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription("Discord member.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
];

export const allCommands = [
    ...publicCommands,
    ...adminCommands
];