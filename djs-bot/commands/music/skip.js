const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const playerUtil = require("../../util/player");
const { redEmbed } = require("../../util/embeds");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("skip")
	.setDescription("Skip the current song")
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
						.setDescription("There is nothing to skip."),
				],
				ephemeral: true,
			});
		}

		const song = player.queue.current;

		const status = playerUtil.skip(player);

		if (status === 1) {
			const ret = interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription(
							`❌ | There is nothing after [${song.title}](${song.uri}) in the queue.`,
						),
				],
			});
			deleteMessageDelay(ret);
			return ret;
		}

		const ret = await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("✅ | **Skipped!**"),
			],
		 	fetchReply: true 
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
