const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('icon')
    .setDescription('Change the bot\'s icon')
    .addAttachmentOption(option => option
        .setName('avatar')
        .setDescription('The avatar you want to set for the bot')
        .setRequired(true)
    ),
    async execute (interaction) {
        const {options} = interaction;
        const avatar = options.getAttachment('avatar');

        const guildId = interaction.guild.id;

        await interaction.deferReply();

        try {
            await client.user.setAvatar(avatar.url);
        } catch (e) {
            client.error(
                "Error setting bot avatar in guild:",
                guildId
            );
            client.error(e);

            return interaction.editReply("Error updating bot icon");
        }

        return interaction.editReply("Bot icon updated!");

    }
}
