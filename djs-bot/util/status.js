const { ActivityType } = require("discord.js");
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const UserAgent = require('fake-useragent');
const { chromium } = require('playwright');

let idleInterval = null;

// Path to the cache file (adjust the directory as needed)
const CACHE_FILE_PATH = path.join(__dirname, 'hanimeTrending.cache');

async function getSignature() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: UserAgent(),
  });
  const page = await context.newPage();

  try {
    await page.goto('https://hanime.tv/browse', { timeout: 30000 });

    // Wait a bit more for background requests that may be triggered after initial load
    const request = await page.waitForRequest(/rapi\/v7\/browse-trending|freeanimehentai\.net|rapi\/v7/i, { timeout: 15000 });

    const headers = request.headers();
    return {
      'x-signature': headers['x-signature'],
      'x-time': headers['x-time'],
      'x-user-license': headers['x-user-license'],
      'x-session-token': headers['x-session-token'],
      'x-signature-version': headers['x-signature-version'],
    }

  } catch (err) {
    console.error('Error during capture:', err && err.message ? err.message : err);
  } finally {
    await browser.close();
  }
}

// Helper function to fetch data with custom headers
async function fetchTrending(page) {
  const url = `https://h.freeanimehentai.net/rapi/v7/browse-trending?time=week&page=${page}`;
  const headers = {
    ...await getSignature(),
    'Origin': 'https://hanime.tv',
    'Referer': 'https://hanime.tv/',
  };
  try {
    const res = await axios.get(url, { headers });
    return res.data.hentai_videos || [];
  } catch (error) {
    throw new Error(`Error fetching data: ${error.message}`);
  }
}

/**
 * Fetches a random Hanime trending title.
 * Caches the result once a day, and will only update if the cache is older than 24 hours.
 *
 * @returns {Promise<string|null>} A random trending hentai title or null if none found.
 */
async function getRandomHanimeTrending() {
  const now = Date.now();
  const ONE_DAY = (24 + 2 * Math.random()) * 3600 * 1000; // 24 hours + random 0-2 hours

  // 1. Attempt to read the cache file.
  let cacheData;
  try {
    const fileData = await fs.readFile(CACHE_FILE_PATH, 'utf8');
    cacheData = JSON.parse(fileData);
  } catch (err) {
    // It's okay if the file doesn't exist or can't be parsed — we'll fetch fresh data below.
  }

  // 2. Check if we have valid cache (exists and is under 24 hours old)
  if (cacheData && cacheData.timestamp && (now - cacheData.timestamp < ONE_DAY)) {
    // Cache is fresh, pick a random title from the cached data
    const { data } = cacheData;
    if (data && data.length) {
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].name;
    }
  }

  // 3. Otherwise, fetch fresh data
  let data = []
  for (let page = 0; page < 3; page++) {
    data = data.concat(await fetchTrending(page));
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 3000));  // Delay between requests (1-4 seconds)
  }

  if (!data.length) return null;

  // 4. Store new data in the cache file (with timestamp)
  const newCache = {
    timestamp: now,
    data: data
  };

  try {
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(newCache, null, 2), 'utf8');
  } catch (writeErr) {
    console.error('Failed to write cache file:', writeErr);
  }

  // 5. Pick a random title and return it
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].name;
}

/**
 * Set the bot's activity to "Watching <random trending hentai>".
 */
function setActivityWatching(client) {
  getRandomHanimeTrending().then((animeTitle) => {
    if (animeTitle) {
      client.user.setActivity({ name: animeTitle, type: ActivityType.Watching });
    } else {
      client.user.setActivity({ name: 'Hentai', type: ActivityType.Watching });
    }
  }).catch((error) => {
    console.error('Error setting activity:', error.message);
    client.user.setActivity({ name: 'Hentai', type: ActivityType.Watching });
  });
}

/**
 * Randomly choose between Playing a hentai game or Watching a hentai video
 * every 32 minutes by default.
 */
function setActivityIdle(client) {
  if (idleInterval) clearInterval(idleInterval);

  setActivityWatching(client);

  idleInterval = setInterval(() => {setActivityWatching(client);}, 1260000);  // 21 minutes
}

/**
 * Set the bot's activity to "Listening to <track_name>".
 * Clears the idle interval so it doesn't overwrite the activity.
 */
function setActivityListening(client, track_name) {
  if (idleInterval) clearInterval(idleInterval);
  client.user.setActivity({ 
    name: track_name,
    type: ActivityType.Listening
  });
}

module.exports = {
  setActivityIdle,
  setActivityListening,
  fetchTrending
};
