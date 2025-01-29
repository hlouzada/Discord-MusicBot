const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("loopq")
	.setDescription("Loop the current song queue")
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
		
		player.setQueueRepeat(!player.queueRepeat);

		const queueRepeat = player.queueRepeat? "enabled" : "disabled";
		
		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						`:thumbsup: | **Loop queue is now \`${ queueRepeat }\`**`,
					),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
