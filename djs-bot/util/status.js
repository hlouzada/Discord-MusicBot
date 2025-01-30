const { ActivityType } = require("discord.js");

const axios = require('axios');
const puppeteer = require('puppeteer');


/**
 * Fetches a random hentai anime that started airing (or was released)
 * within the past 7 days, using the Jikan (unofficial MAL) API.
 *
 * @returns {Promise<Object|null>} A random hentai anime object or null if none found.
 */
async function getRandomHentaiReleasedThisWeek() {
  try {
    // Calculate the date range (past 14 days)
    const start_date = new Date();
    start_date.setDate(start_date.getDate() - 14);

    // Jikan API endpoint that fetches anime by genre.
    const apiUrl = `https://api.jikan.moe/v4/anime?rating=rx&order_by=popularity&start_date=${start_date.toISOString().slice(0, 10)}`;

    // Fetch the data (by default, this is the first page only)
    const response = await axios.get(apiUrl);
    const animeData = response.data.data; // Array of anime objects

    if (animeData.length === 0) {
      console.log('No hentai releases found.');
      return null;
    }

    // Pick a random anime from the filtered list
    const randomIndex = Math.floor(Math.random() * animeData.length);
    return animeData[randomIndex].title;
  } catch (error) {
    console.error('Error fetching hentai releases:', error.message);
    return null;
  }
}


async function getRandomHentaiSteamPromo() {
  const url =
    'https://steamdb.info/sales/?displayOnly=Game&min_discount=50&min_rating=60&min_reviews=500&sort=rating_desc&tagid=9130';

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // 2. Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // 3. Wait for at least one row to appear
  //    Adjust this selector if your table structure changes
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

function setActivityWatching(client) {
  getRandomHentaiReleasedThisWeek().then((animeTitle) => {
    if (animeTitle) {
      client.user.setActivity({ name: animeTitle, type: ActivityType.WATCHING });
    } else {
      client.user.setActivity({ name: 'Hentai', type: ActivityType.WATCHING });
    }
  });
}

function setActivityPlaying(client) {
  getRandomHentaiSteamPromo().then((gameTitle) => {
    if (gameTitle) {
      client.user.setActivity({ name: gameTitle, type: ActivityType.PLAYING });
    } else {
      setActivityWatching(client);
    }
  });
}

function setActivityIdle(client) {
  if (Math.floor(Math.random() * 2)) {
    setActivityPlaying(client);
  } else {
    setActivityWatching(client);
  }
}

module.exports = { setActivityIdle };
