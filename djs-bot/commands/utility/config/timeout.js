const { config } = require("dotenv");
const { setReplyDeleteTimeout } = require("../../../util/message");
const { setAutoLeaveTimeout } = require("../../../util/musicManager");


/**
 * @param {import("../../../lib/SlashCommand")} baseCommand
 */
module.exports = function timeout(baseCommand) {
	baseCommand.addSubcommand((command) =>
		command
		.setName("timeout")
		.setDescription("Set server timeout")
		.addStringOption((opt) =>
			opt
			.setName("option")
			.setDescription("Select reply or disconnect timeout")
			.setRequired(true)
			.addChoices(
				{ name: "Reply", value: "reply" },
				{ name: "Disconnect", value: "disconnect" },				
			)
		)
		.addIntegerOption((opt) =>
			opt
			.setName("timeout")
			.setDescription("Set timeout in seconds, leave empty to reset")
		)
	);

	return baseCommand.setSubCommandHandler(
		"timeout",
		async function (client, interaction, options) {
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

			const is_reply = options.getString("option") === "reply";

			if (is_reply) {
				timeout = timeout || config.defaultConfig.replyDeleteTimeout;
				setReplyDeleteTimeout(guildId, timeout);
			} else {
				timeout = timeout || config.defaultConfig.autoLeaveTimeout;
				setAutoLeaveTimeout(guildId, timeout);
			}

			return interaction.reply({
				embeds: [
					client.greenEmbed({
						desc: `${is_reply ? "Reply" : "Disconnect"} timeout set to ${timeout/1000} seconds`,
					}),
				],
			});

		}
	);
};
