const { ActivityType } = require("discord.js");
const axios = require('axios');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const UserAgent = require('fake-useragent');

let idleInterval = null;

/**
 * Helper function to fetch JSON from a given URL
 * using the required Hanime headers.
 */
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
 * Defaults to trending of 'week' at page 0.
 *
 * @returns {Promise<string|null>} A random trending hentai title or null if none found.
 */
async function getRandomHanimeTrending() {
  const trendingUrl = 'https://h.freeanimehentai.net/rapi/v7/browse-trending?time=week&page=0';
  const data = await fetchHeaders(trendingUrl);
  if (!data || !data.hentai_videos) return null;

  const trendingList = data.hentai_videos;

  if (!trendingList.length) {
    console.log('No hentai found in trending.');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * trendingList.length);
  return trendingList[randomIndex].name;
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
