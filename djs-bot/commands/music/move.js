const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { spliceQueue } = require("../../util/player");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("move")
	.setDescription("Moves track to a different position")
	.addIntegerOption((option) =>
		option.setName("track").setDescription("The track number to move").setRequired(true)
	)
	.addIntegerOption((option) =>
		option
			.setName("position")
			.setDescription("The position to move the track to")
			.setRequired(true)
	)

	.setRun(async (client, interaction) => {
		const track = interaction.options.getInteger("track");
		const position = interaction.options.getInteger("position");

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
						.setDescription("There's nothing playing."),
				],
				ephemeral: true,
			});
		}

		let trackNum = Number(track) - 1;
		if (trackNum < 0 || trackNum > player.queue.length - 1) {
			const ret = interaction.reply(":x: | **Invalid track number**");
			deleteMessageDelay(ret);
			return ret;
		}

		let dest = Number(position) - 1;
		if (dest < 0 || dest > player.queue.length - 1) {
			const ret = interaction.reply(":x: | **Invalid position number**");
			deleteMessageDelay(ret);
			return ret;
		}

		const thing = player.queue[trackNum];

		spliceQueue(player, trackNum, 1);
		spliceQueue(player, dest, 0, thing);

		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(":white_check_mark: | **Moved track**"),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
