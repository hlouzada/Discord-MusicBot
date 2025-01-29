const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const { getControlChannelMessage } = require("../../util/controlChannel");

const command = new SlashCommand()
	.setName("clean")
	.setDescription("Cleans the last 100 bot messages from channel.")
	.addIntegerOption((option) =>
		option
			.setName("number")
			.setDescription("Number of messages to delete.")
			.setMinValue(2).setMaxValue(100)
			.setRequired(false),
	)
	.setRun(async (client, interaction, options) => {
		
		await interaction.deferReply();
		let number = interaction.options.getInteger("number");
		number = number && number < 100? ++number : 100;
		
		const controlChannelMessage = await getControlChannelMessage(interaction.guildId);

		interaction.channel.messages.fetch({
			limit: number,
		}).then((messages) => {
			const botMessages = messages.filter(
				m => m.author.id === client.user.id && (!controlChannelMessage || m.id !== controlChannelMessage.id)
			);

			interaction.channel.bulkDelete(botMessages, true)
				.then(async deletedMessages => {
					//Filtering out messages that did not get deleted.
					messages = messages.filter(msg => {
						!deletedMessages.some(deletedMsg => deletedMsg == msg);
					});
					if (messages.size > 0) {
						client.log(`Deleting [${ messages.size }] messages older than 14 days.`)
						for (const msg of messages) {
							await msg.delete();
						}
					}
				})
			
		});
	})

module.exports = command;
