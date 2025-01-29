const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("loop")
	.setDescription("Loops the current song")
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
						.setDescription("Nothing is playing right now."),
				],
				ephemeral: true,
			});
		}
		
		player.setTrackRepeat(!player.trackRepeat);
		const trackRepeat = player.trackRepeat? "enabled" : "disabled";
		
		const ret = interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`👍 | **Loop has been \`${ trackRepeat }\`**`),
			],
		});
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
