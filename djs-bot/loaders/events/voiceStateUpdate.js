const musicEvents = require("../../lib/MusicEvents");

module.exports = async (client, oldState, newState) => {
	await musicEvents.handleVoiceStateUpdate(oldState, newState);
};
