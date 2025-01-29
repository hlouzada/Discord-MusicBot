const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { shuffleQueue } = require("../../util/player");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("shuffle")
	.setDescription("Randomizes the queue")
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
						.setDescription("There is no music playing."),
				],
				ephemeral: true,
			});
		}

		if (!player.queue || !player.queue.length || player.queue.length === 0) {
			const ret = interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription(
							"❌ | There are not enough songs in the queue."
						),
				],
			});
			deleteMessageDelay(ret);
			return ret;
		}

		//  if the queue is not empty, shuffle the entire queue
		shuffleQueue(player);
		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						"🔀 | **Successfully shuffled the queue.**"
					),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
