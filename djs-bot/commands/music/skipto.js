const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { removeTrack } = require("../../util/player");
const { deleteMessageDelay } = require("../../util/message");


const command = new SlashCommand()
	.setName("skipto")
	.setDescription("skip to a specific song in the queue")
	.addNumberOption((option) =>
		option
			.setName("number")
			.setDescription("The number of tracks to skipto")
			.setRequired(true)
	)

	.setRun(async (client, interaction, options) => {
		const args = interaction.options.getNumber("number");
		//const duration = player.queue.current.duration

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
						.setDescription("I'm not in a channel."),
				],
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		const position = Number(args);

		try {
			if (!position || position < 0 || position > player.queue.size) {
				const thing = new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("❌ | Invalid position!");
				const ret = interaction.editReply({ embeds: [thing] });
				deleteMessageDelay(ret);
				return ret;
			}

			removeTrack(player, 0, position - 1);
			player.stop();

			const thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription("✅ | Skipped to position " + position);

			const ret = interaction.editReply({ embeds: [thing] });
			deleteMessageDelay(ret);
			return ret;
		} catch {
			if (position === 1) {
				player.stop();
			}
			const ret = interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription(
							"✅ | Skipped to position " + position
						),
				],
			});
			deleteMessageDelay(ret);
			return ret;
		}
	});

module.exports = command;
