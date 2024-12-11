const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { pause } = require("../../util/player");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("resume")
	.setDescription("Resume current track")
	.setRun(async (client, interaction, options) => {
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
						.setDescription("There is no song playing right now."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.paused) {
			const ret = interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription("❌ | Current track is already playing!"),
				],
			});
			deleteMessageDelay(ret);
			return ret;
		}

		pause(player, false);

		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`⏯ **Resumed!**`),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
