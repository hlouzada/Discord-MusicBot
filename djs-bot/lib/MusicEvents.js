"use strict";

const colors = require("colors");
const { ActivityType } = require('discord.js')
const { getClient } = require("../bot");
const socket = require("../api/v1/dist/ws/eventsHandler");
const {
	updateControlMessage,
	updateNowPlaying,
	runIfNotControlChannel,
} = require("../util/controlChannel");
const { trackStartedEmbed } = require("../util/embeds");
const { getAutoLeaveTimeout } = require("../util/musicManager");

// entries in this map should be removed when bot disconnected from vc
const progressUpdater = new Map();

function stopProgressUpdater(guildId) {
	const prevInterval = progressUpdater.get(guildId);

	if (prevInterval) {
		clearInterval(prevInterval);
		progressUpdater.delete(guildId);
	}
}

function updateProgress({ player, track }) {
	const gid = player.guild;
	if (!gid?.length) return;

	stopProgressUpdater(gid);

	progressUpdater.set(
		gid,
		setInterval(() => {
			if (!player.playing || player.paused) return;

			player.position += 1000;

			socket.handleProgressUpdate({
				guildId: player.guild,
				position: player.position,
			});
		}, 1000)
	);
}

async function handleVoiceStateUpdate(oldState, newState) {
	const client = getClient();

	//ignore if bot left the channel
	if (oldState.id === client.user.id) return;

	if (!client.manager.Engine) return;

	const player = client.manager.Engine.players.get(oldState.guild.id);

	if (!player) return;

	if (!oldState.channel && !newState.channel) return;

	if (!oldState.channel && player.voiceChannel === newState.channel.id && newState.channel.members.size === 2) {
		if (player.autoPause && player.get("autoPauseSet") && player.paused) {
			player.set("autoPauseSet", false);
			player.pause(false);
			handlePause({ player: player, state: false });
		} else if (!player.autoPause && player.get("autoPauseSet") && player.paused) {
			player.set("autoPauseSet", false);
		}
		const autoLeaveTimeout = player.get("autoLeaveTimeoutSet");
		if (autoLeaveTimeout) {
			clearTimeout(autoLeaveTimeout);
			player.set("autoLeaveTimeoutSet", null);
		}
		return;
	}

	if (player.voiceChannel !== oldState.channel.id || oldState.channel.members.size > 2 || newState.channel) return;

	if (player.twentyFourSeven) {
		player.queue.clear();
		player.stop();
		player.set("autoQueue", false);
		handleStop({ player });
		triggerSocketQueueUpdate(player);
		return;
	}

	if (player.autoLeave) {
		player.destroy();
		handleStop({ player });
		triggerSocketQueueUpdate(player);
		return;
	}

	if (player.autoPause && !player.paused) {
		player.set("autoPauseSet", true);
		player.pause(true);
		handlePause({
			player,
			state,
		});
	}

	const autoLeaveTimeout = setTimeout(() => {
		if (player.twentyFourSeven) {
			player.queue.clear();
			player.stop();
			player.set("autoQueue", false);
			handleStop({ player });
			triggerSocketQueueUpdate(player);
			player.set("autoPauseSet", false);
			player.set("autoLeaveTimeoutSet", null);
		} else {
			player.destroy();
			handleStop({ player });
			triggerSocketQueueUpdate(player);
		}
	}, await getAutoLeaveTimeout(oldState.guild.id));

	player.set("autoLeaveTimeoutSet", autoLeaveTimeout);
}

function handleStop({ player }) {
	socket.handleStop({ guildId: player.guild });

	const client = getClient();

	client.user.setActivity({
		name: "Hentai",
		type: ActivityType.Watching,
	});
}

function handleQueueUpdate({ guildId, player }) {
	socket.handleQueueUpdate({ guildId, player });
}

function sendTrackHistory({ player, track }) {
	const history = player.get("history");
	if (!history) return;

	runIfNotControlChannel(player, () => {
		const client = getClient();

		client.channels.cache
			.get(player.textChannel)
			?.send({
				embeds: [
					trackStartedEmbed({ track, player, title: "Played track" }),
				],
			})
			.catch(client.warn);
	});
}

/**
 * @param {import("./MusicEvents").IHandleTrackStartParams}
 */
function handleTrackStart({ player, track }) {
	const client = getClient();

	const playedTracks = client.playedTracks;

	if (playedTracks.length >= 25) playedTracks.shift();

	if (!playedTracks.includes(track)) playedTracks.push(track);

	updateNowPlaying(player, track);
	updateControlMessage(player.guild, track);
	// sendTrackHistory({ player, track });

	socket.handleTrackStart({ player, track });
	socket.handlePause({ guildId: player.guild, state: player.paused });
	handleQueueUpdate({ guildId: player.guild, player });

	updateProgress({ player, track });

	client.user.setActivity({
		name: track.title,
		type: ActivityType.Listening,
	});

	client.warn(
		`Player: ${player.guild} | Track has started playing [${colors.blue(track.title)}]`
	);
}

function handlePause({ player, state }) {
	socket.handlePause({ guildId: player.guild, state });

	const client = getClient();

	client.user.setActivity({
		name: "Nothing",
		type: ActivityType.Listening,
	});
}

module.exports = {
	handleTrackStart,
	handleQueueUpdate,
	handleStop,
	updateProgress,
	stopProgressUpdater,
	handleVoiceStateUpdate,
	handlePause,
};
