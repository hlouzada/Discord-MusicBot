const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("volume")
	.setDescription("Change the volume of the current song.")
	.addNumberOption((option) =>
		option
			.setName("amount")
			.setDescription("Amount of volume you want to change. Ex: 10")
			.setRequired(false),
	)
	.setRun(async (client, interaction) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager.Engine) {
			player = client.manager.Engine.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Lavalink node is not connected"),
				],
				ephemeral: true,
			});
		}
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("There is no music playing."),
				],
				ephemeral: true,
			});
		}
		
		let vol = interaction.options.getNumber("amount");
		if (!vol || vol < 1 || vol > 125) {
			const ret = interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription(
							`:loud_sound: | Current volume **${ player.volume }**`,
						),
				],
			});
			deleteMessageDelay(ret);
			return ret;
		}
		
		player.setVolume(vol);
		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						`:loud_sound: | Successfully set volume to **${ player.volume }**`,
					),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
