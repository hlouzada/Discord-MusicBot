const { ActivityType } = require("discord.js");
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const UserAgent = require('fake-useragent');

let idleInterval = null;

// Path to the cache file (adjust the directory as needed)
const CACHE_FILE_PATH = path.join(__dirname, 'hanimeTrending.cache');

// Helper function to fetch data with custom headers
async function fetchHeaders(url) {
  try {
    const headers = {
      'X-Signature-Version': 'web2',
      'X-Signature': crypto.randomBytes(32).toString('hex'),
      'User-Agent': new UserAgent().random
    };
    const res = await axios.get(url, { headers });
    return res.data;
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
  const ONE_DAY = 24 * 60 * 60 * 1000;

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
    const { hentai_videos } = cacheData;
    if (!hentai_videos || !hentai_videos.length) {
      console.log('No hentai found in cached data.');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * hentai_videos.length);
    return hentai_videos[randomIndex].name;
  }

  // 3. Otherwise, fetch fresh data
  const trendingUrl = 'https://h.freeanimehentai.net/rapi/v7/browse-trending?time=week&page=0';
  const data = await fetchHeaders(trendingUrl);
  if (!data || !data.hentai_videos || !data.hentai_videos.length) {
    console.log('No hentai found in trending.');
    return null;
  }

  // 4. Store new data in the cache file (with timestamp)
  const newCache = {
    timestamp: now,
    hentai_videos: data.hentai_videos
  };

  try {
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(newCache, null, 2), 'utf8');
  } catch (writeErr) {
    console.error('Failed to write cache file:', writeErr);
  }

  // 5. Pick a random title and return it
  const randomIndex = Math.floor(Math.random() * data.hentai_videos.length);
  return data.hentai_videos[randomIndex].name;
}

/**
 * Fetches a random hentai Steam promo game (using Puppeteer).
 */
async function getRandomHentaiSteamPromo() {
  const url =
    'https://steamdb.info/sales/?displayOnly=Game&min_discount=50&min_rating=60&min_reviews=500&sort=rating_desc&tagid=9130';

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // 2. Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // 3. Wait for at least one row to appear
  await page.waitForSelector('tr.app');
  
  // 4. Extract titles from each table row
  const titles = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr.app');
    const extracted = [];
    rows.forEach((row) => {
      // The 3rd <td> has the <a> with the text
      const titleLink = row.querySelector('td:nth-child(3) a.b');
      if (titleLink) {
        extracted.push(titleLink.textContent.trim());
      }
    });
    return extracted;
  });
  
  // 5. Close the browser
  await browser.close();

  // 6. Return a random title (or null if not found)
  if (titles.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * titles.length);
  return titles[randomIndex];
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
 * Set the bot's activity to "Playing <random hentai Steam promo>".
 * If none is found, fallback to setActivityWatching.
 */
function setActivityPlaying(client) {
  getRandomHentaiSteamPromo().then((gameTitle) => {
    if (gameTitle) {
      client.user.setActivity({ name: gameTitle, type: ActivityType.Playing });
    } else {
      setActivityWatching(client);
    }
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
  setActivityListening
};
