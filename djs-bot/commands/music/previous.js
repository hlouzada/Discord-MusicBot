const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const playerUtil = require("../../util/player");
const { redEmbed } = require("../../util/embeds");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
.setName("previous")
.setDescription("Go back to the previous song.")
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
					.setDescription("There are no previous songs for this session."),
			],
			ephemeral: true,
		});
	}

	const previousSong = player.queue.previous;
	const status = await playerUtil.playPrevious(player);

	if (status === 1) {
		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					"❌ | There is no previous song in the queue."
				),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	}

	const ret = interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`⏮ | Previous song: **${ previousSong.title }**`,
				),
		],
	});
	deleteMessageDelay(ret);
	return ret;
});

module.exports = command;
