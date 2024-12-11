const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const { historyEmbed } = require("../../util/embeds");
const { deleteMessageDelay } = require("../../util/message");

const command = new SlashCommand()
	.setName("history")
	.setDescription("Keep song history in chat (toggle)")
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
						.setDescription("There's nothing playing in the queue"),
				],
				ephemeral: true,
			});
		}

		const history = player.get("history");
		player.set("requester", interaction.guild.members.me);

		if (!history) {
			player.set("history", true);
		} else {
			player.set("history", false);
		}

		client.warn(
			`Player: ${ player.options.guild } | [${ colors.blue(
				"history",
			) }] has been [${ colors.blue(!history? "ENABLED" : "DISABLED") }] in ${
				client.guilds.cache.get(player.options.guild)
					? client.guilds.cache.get(player.options.guild).name
					: "a guild"
			}`,
		);

		const ret = await interaction.reply({ embeds: [historyEmbed({history})], fetchReply: true });
		deleteMessageDelay(ret);
		return ret;
	});

module.exports = command;
