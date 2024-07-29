const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../../db/database');

const loadEpisodes = async () => {
  const episodesFromCsv = [];
  const colorsData = [];

  // Read episodes.csv
  const readEpisodes = new Promise((resolve, reject) => {
    fs.createReadStream('data/episodes.csv')
      .pipe(csv(['title', 'broadcast_date', 'season', 'episode', 'painting_index', 'notes', 'youtube_url', 'image_url']))
      .on('data', (row) => {
        episodesFromCsv.push(row);
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      });
  });

  // Read colors.csv
  const readColors = new Promise((resolve, reject) => {
    fs.createReadStream('data/colors.csv')
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim() // Trim headers to avoid whitespace issues
      }))
      .on('data', (row) => {
        colorsData.push(row);
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      });
  });

  // Wait for both files to be read
  await Promise.all([readEpisodes, readColors]);

  // Create a map of color data for easy lookup
  const colorMap = new Map();
  colorsData.forEach((row) => {
    const title = row.painting_title.trim();
    colorMap.set(title, {
      season: parseInt(row.season, 10) || null,
      episode: parseInt(row.episode, 10) || null,
      painting_index: parseInt(row.painting_index, 10) || null,
      youtube_url: row.youtube_src,
      image_url: row.img_src
    });
  });

  // Insert combined data into the database
  for (const episode of episodesFromCsv) {
    const colorData = colorMap.get(episode.title);
    if (colorData) {
      try {
        await query(`
          INSERT INTO episodes (title, broadcast_date, season, episode, painting_index, notes, youtube_url, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          episode.title,
          new Date(episode.broadcast_date),
          colorData.season,
          colorData.episode,
          colorData.painting_index,
          episode.notes,
          colorData.youtube_url,
          colorData.image_url
        ]);
        console.log(`Inserted episode: ${episode.title}`);
      } catch (err) {
        console.error(`Error inserting episode: ${err.message}`);
      }
    } else {
      console.warn(`No color data found for episode: ${episode.title}`);
    }
  }
};

module.exports = { loadEpisodes };
