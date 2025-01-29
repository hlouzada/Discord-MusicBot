const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const playerUtil = require("../../util/player");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("stop")
	.setDescription("Stops whatever the bot is playing and leaves the voice channel\n(This command will clear the queue)")
	
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
						.setDescription("I'm not in a channel."),
				],
				ephemeral: true,
			});
		}
		
		const status = playerUtil.stop(player);
		
		const ret = await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`:wave: | **Bye Bye!**`),
			],
			fetchReply: true
		});

		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
