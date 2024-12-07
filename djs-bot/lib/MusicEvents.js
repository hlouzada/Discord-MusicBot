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

function handleVoiceStateUpdate(oldState, newState) {
	// not leaving vc
	if (newState.channelId) return;

	// not client user
	if (newState.member.id !== newState.client.user.id) return;

	const gid = newState.guild.id;

	stopProgressUpdater(gid);
	socket.handleStop({ guildId: gid });
}

function handleStop({ player }) {
	socket.handleStop({ guildId: player.guild });

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
	sendTrackHistory({ player, track });

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
