const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { removeTrack } = require("../../util/player");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("remove")
	.setDescription("Remove track you don't want from queue")
	.addNumberOption((option) =>
		option.setName("number").setDescription("Enter track number.").setRequired(true)
	)

	.setRun(async (client, interaction) => {
		const args = interaction.options.getNumber("number");

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
						.setDescription("There are no songs to remove."),
				],
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		const position = Number(args) - 1;
		if (position > player.queue.size) {
			let thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`❌ | Current queue has only **${player.queue.size}** track`
				);
			const ret = interaction.editReply({ embeds: [thing] });
			deleteMessageDelay(ret);
			return ret;
		}

		removeTrack(player, position);

		const number = position + 1;
		let removeEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`✅ | Removed track number **${number}** from queue`);

		const ret = interaction.editReply({ embeds: [removeEmbed] });
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
