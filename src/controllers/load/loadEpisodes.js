const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../../db/database');
const { parseDate } = require('../../utils/dateUtils');

const loadEpisodes = async () => {
  const episodesFromCsv = [];
  const colorsData = [];
  const subjectsData = [];

  // Read episodes.csv
  const readEpisodes = new Promise((resolve, reject) => {
    fs.createReadStream('data/episodes.csv')
      .pipe(csv(['title', 'broadcast_date', 'notes']))
      .on('data', (row) => {
        const title = row.title.trim();
        const broadcast_date = parseDate(row.broadcast_date.trim());
        const notes = row.notes ? row.notes.trim() : null;

        episodesFromCsv.push({ title, broadcast_date, notes });
      })
      .on('end', resolve)
      .on('error', reject);
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
      .on('end', resolve)
      .on('error', reject);
  });

  // Read subjects.csv
  const readSubjects = new Promise((resolve, reject) => {
    fs.createReadStream('data/subjects.csv')
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim() // Trim headers to avoid whitespace issues
      }))
      .on('data', (row) => {
        subjectsData.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Wait for all files to be read
  await Promise.all([readEpisodes, readColors, readSubjects]);

  // Create a map of color data for easy lookup
  const colorMap = new Map();
  colorsData.forEach((row) => {
    const title = row.painting_title.trim().toLowerCase();
    colorMap.set(title, {
      season: parseInt(row.season, 10) || null,
      episode: parseInt(row.episode, 10) || null,
      painting_index: parseInt(row.painting_index, 10) || null,
      youtube_url: row.youtube_src,
      image_url: row.img_src
    });
  });

  // Create a map for subjects data to look up episodes and titles
  const subjectsMap = new Map();
  subjectsData.forEach((row) => {
    const episodeId = row['EPISODE'].trim().toUpperCase();
    const match = episodeId.match(/S(\d+)E(\d+)/i);
    if (match) {
      const season = parseInt(match[1], 10);
      const episodeNum = parseInt(match[2], 10);
      const title = row['TITLE'].trim().toLowerCase();
      subjectsMap.set(title, { season, episodeNum });
    }
  });

  // Insert combined data into the database
  for (const episode of episodesFromCsv) {
    const titleLower = episode.title.toLowerCase();
    const colorData = colorMap.get(titleLower);
    const subjectData = subjectsMap.get(titleLower) || {};

    // Determine the best available data for season and episode
    const season = colorData ? colorData.season : subjectData.season || null;
    const episodeNum = colorData ? colorData.episode : subjectData.episodeNum || null;
    const paintingIndex = colorData ? colorData.painting_index : null;
    const youtubeUrl = colorData ? colorData.youtube_url : null;
    const imageUrl = colorData ? colorData.image_url : null;

    try {
      await query(`
        INSERT INTO episodes (title, broadcast_date, season, episode, painting_index, notes, youtube_url, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        episode.title,
        new Date(episode.broadcast_date),
        season,
        episodeNum,
        paintingIndex,
        episode.notes,
        youtubeUrl,
        imageUrl
      ]);
      // console.log(`Inserted episode: ${episode.title}`);
    } catch (err) {
      console.error(`Error inserting episode: ${err.message}`);
    }
  }

  // Log missing episodes (if necessary for debugging)
  for (const [title, subjectData] of subjectsMap.entries()) {
    const episode = episodesFromCsv.find(e => e.title.toLowerCase() === title);
    if (!episode) {
      console.log(`Episode ID not found for title: ${title}`);
    }
  }
};

module.exports = { loadEpisodes };
