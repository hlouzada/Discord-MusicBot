"use strict";

const { getClient } = require("../bot");

/**
 * @type {Map<string, Int>}
 */
const autoLeaveTimeout = new Map();


const getAutoLeaveTimeout = async (guildId) => {
	const cache = autoLeaveTimeout.get(guildId);
	if (cache !== undefined) return cache;

	const client = getClient();

	if (!client.db) return client.config.defaultConfig.autoLeaveTimeout;

	const { autoLeaveTimeout: timeout } = await client.db.guild.findFirst({
		where: {
			guildId,
		},
	});

	if (!timeout) {
		const defaultTimeout = client.config.defaultConfig.autoLeaveTimeout;
		setAutoLeaveTimeout(guildId, defaultTimeout);
		return defaultTimeout;
	}

	return timeout;
};

const setAutoLeaveTimeout = async (guildId, timeout) => {
	autoLeaveTimeout.set(guildId, timeout);

	const client = getClient();

	if (!client.db) return;

	await client.db.guild.upsert({
		where: {
			guildId,
		},
		create: { autoLeaveTimeout: timeout, guildId },
		update: { autoLeaveTimeout: timeout },
	});
};

const setDefaultPlayerConfig = (instance) => {
	const config = getClient().config;
	const defaultValues = config.defaultPlayerValues;

	if (typeof defaultValues !== "object") return;

	const defaultKeys = Object.keys(config.defaultPlayerValues);

	defaultKeys.forEach((key) => {
		instance.set(key, defaultValues[key]);
	});
};

module.exports = {
	setDefaultPlayerConfig,
	getAutoLeaveTimeout,
	setAutoLeaveTimeout,
};
