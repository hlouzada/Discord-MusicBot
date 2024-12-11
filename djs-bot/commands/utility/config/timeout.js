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

			let timeout = options.getInteger("timeout");
			
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

			if (is_reply)
				setReplyDeleteTimeout(guildId, timeout || config.defaultConfig.replyDeleteTimeout);
			else
				setAutoLeaveTimeout(guildId, timeout || config.defaultConfig.autoLeaveTimeout);

			return interaction.reply({
				embeds: [
					client.greenEmbed({
						desc: `${is_reply ? "Reply" : "Disconnect"} timeout set to ${timeout} seconds`,
					}),
				],
			});

		}
	);
};
