const { ActivityType } = require("discord.js");
const axios = require('axios');

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
    return animeData[randomIndex];
  } catch (error) {
    console.error('Error fetching hentai releases:', error.message);
    return null;
  }
}


function setActivityIdle(client) {
  getRandomHentaiReleasedThisWeek().then((anime) => {
    if (anime !== null) {
      client.user.setActivity({ name:anime.title, type: ActivityType.Watching });
    } else {
      client.user.setActivity({ name: 'Hentai', type: ActivityType.Watching });
    }
  });  
}

module.exports = { setActivityIdle };
