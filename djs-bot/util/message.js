const { getClient } = require("../bot");

/**
 * @type {Map<string, Int>}
 */
const replyDeleteTimeout = new Map();


const getReplyDeleteTimeout = async (guildId) => {
	const cache = replyDeleteTimeout.get(guildId);
	if (cache !== undefined) return cache;

	const client = getClient();

	if (!client.db) return client.config.defaultConfig.replyDeleteTimeout;

	const { replyDeleteTimeout: timeout } = await client.db.guild.findFirst({
		where: {
			guildId,
		},
	});

	if (!timeout) {
		const defaultTimeout = client.config.defaultConfig.replyDeleteTimeout;
		setReplyDeleteTimeout(guildId, defaultTimeout);
		return defaultTimeout;
	}

	return timeout;
};


const setReplyDeleteTimeout = async (guildId, timeout) => {
	replyDeleteTimeout.set(guildId, timeout);

	const client = getClient();

	if (!client.db) return;

	await client.db.guild.upsert({
		where: {
			guildId,
		},
		create: { replyDeleteTimeout: timeout, guildId },
		update: { replyDeleteTimeout: timeout },
	});
};


const deleteMessageDelay = async (message) => {
	if (!message) return;

	setTimeout(() => message.delete().catch(getClient().warn), await getReplyDeleteTimeout(message.guildId));
};

module.exports = {
	deleteMessageDelay,
	setReplyDeleteTimeout,
};
