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
const { setActivityIdle } = require("../util/status");

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

    // Ignore if the voice state update is for the bot itself
    if (oldState.id === client.user.id) return;

    const manager = client.manager.Engine;
    if (!manager) return;

    // Get the player for this guild using oldState or newState guild info
    const guildId = oldState.guild.id || newState.guild.id;
    const player = manager.players.get(guildId);
    if (!player) return;

    // If neither oldState nor newState has a channel, no change relevant to playback
    if (!oldState.channel && !newState.channel) return;

    // --- USER JOINS CHANNEL ---
    // If a user joined the bot's voice channel and now there's exactly 2 members (bot + user)
    if (!oldState.channel 
        && player.voiceChannel === newState.channel.id 
        && newState.channel.members.size === 2) {
        
        // If previously auto-paused, resume playback
        if (player.autoPause && player.get("autoPauseSet") && player.paused) {
            player.set("autoPauseSet", false);
            player.pause(false);
            handlePause({ player: player, state: false });
        } else if (!player.autoPause && player.get("autoPauseSet") && player.paused) {
            player.set("autoPauseSet", false);
        }

        // Clear any auto-leave timeout since a user returned
        const autoLeaveTimeout = player.get("autoLeaveTimeoutSet");
        if (autoLeaveTimeout) {
            clearTimeout(autoLeaveTimeout);
            player.set("autoLeaveTimeoutSet", null);
        }
        return;
    }

    // --- USER LEAVES OR MOVES CHANNEL ---
    // If the user that caused the update was in the same channel as the player and now left or moved:
    // First, ensure we're dealing with the bot's actual voice channel
    const voiceChannel = oldState.guild.channels.cache.get(player.voiceChannel);
    if (!voiceChannel) return;

    // If the user left or moved and now the channel size is 1 (just the bot)
    // This is where we consider autopause or auto-leave conditions
    if (voiceChannel.members.size === 1) {
        // If autopause is enabled and the player isn't paused yet, pause it
        if (player.autoPause && !player.paused) {
            player.set("autoPauseSet", true);
            player.pause(true);
            handlePause({ player, state: true });
        } else if (player.autoLeave) {
			player.destroy();
			handleStop({ player });
			triggerSocketQueueUpdate(player);
			return;  // No need to set up auto-leave timeout if auto-leave is enabled
		}

        // Set up an auto-leave timeout if configured
        const autoLeaveTimeout = setTimeout(async () => {
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
        }, await getAutoLeaveTimeout(guildId));

        player.set("autoLeaveTimeoutSet", autoLeaveTimeout);
    }
}

function handleStop({ player }) {
	socket.handleStop({ guildId: player.guild });

	const client = getClient();

	setActivityIdle(client);
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
