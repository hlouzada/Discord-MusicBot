const { setReplyDeleteTimeout } = require("../../../util/message");
const { setAutoLeaveTimeout } = require("../../../util/musicManager");

/**
 * @param {import("../../../lib/SlashCommand")} baseCommand
 */
module.exports = function timeout(baseCommand) {
	baseCommand
		.addSubcommandGroup((group) =>
			group
				.setName("timeout")
				.setDescription("Set server timeout settings")
				.addSubcommand((command) =>
					command
						.setName("reply")
						.setDescription("Set reply timeout")
						.addIntegerOption((opt) =>
							opt
								.setName("timeout")
								.setDescription("Set timeout in seconds, leave empty to reset")
						)
				)
				.addSubcommand((command) =>
					command
						.setName("disconnect")
						.setDescription("Set disconnect timeout")
						.addIntegerOption((opt) =>
							opt
								.setName("timeout")
								.setDescription("Set timeout in seconds, leave empty to reset")
						)
				)
		);

	baseCommand.setSubCommandHandler("timeout reply", async function (client, interaction, options) {
		const guildId = interaction.guild.id;
		let timeout = (options.getInteger("timeout") || 0) * 1000;

		if (timeout && timeout < 1) {
			return interaction.reply({
				embeds: [
					client.redEmbed({
						desc: "Timeout must be greater than 0",
					}),
				],
				ephemeral: true,
			});
		}

		timeout = timeout || client.config.defaultConfig.replyDeleteTimeout;
		setReplyDeleteTimeout(guildId, timeout);

		return interaction.reply({
			embeds: [
				client.greenEmbed({
					desc: `Reply timeout set to ${timeout / 1000} seconds`,
				}),
			],
		});
	});

	baseCommand.setSubCommandHandler("timeout disconnect", async function (client, interaction, options) {
		const guildId = interaction.guild.id;
		let timeout = (options.getInteger("timeout") || 0) * 1000;

		if (timeout && timeout < 1) {
			return interaction.reply({
				embeds: [
					client.redEmbed({
						desc: "Timeout must be greater than 0",
					}),
				],
				ephemeral: true,
			});
		}

		timeout = timeout || client.config.defaultConfig.autoLeaveTimeout;
		setAutoLeaveTimeout(guildId, timeout);

		return interaction.reply({
			embeds: [
				client.greenEmbed({
					desc: `Disconnect timeout set to ${timeout / 1000} seconds`,
				}),
			],
		});
	});

	return baseCommand;
};
