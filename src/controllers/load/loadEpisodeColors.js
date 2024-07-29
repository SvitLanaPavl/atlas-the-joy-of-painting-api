const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../../db/database');

const loadEpisodeColors = async () => {
  const episodeColors = [];
  const colorsData = [];

  const readColors = new Promise((resolve, reject) => {
    fs.createReadStream('data/colors.csv')
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const cleanColors = row.colors.replace(/'/g, '"').replace(/[\r\n]+/g, '');
          const cleanColorHex = row.color_hex.replace(/'/g, '"').replace(/[\r\n]+/g, '');
          
          // Parse JSON data
          const colors = JSON.parse(cleanColors);
          const colorHex = JSON.parse(cleanColorHex);

          episodeColors.push({
            episode_title: row.painting_title.trim().toLowerCase(),
            colors,
            colorHex
          });
        } catch (err) {
          console.error(`Error parsing episode colors: ${err.message}`);
        }
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  await readColors;

  const colorNames = Array.from(new Set(episodeColors.flatMap(e => e.colors)));
  const colorIDs = await Promise.all(colorNames.map(async (name) => {
    try {
      const [result] = await query(`SELECT id FROM colors WHERE name = ?`, [name]);
      return result ? result.id : null;
    } catch (err) {
      console.error(`Error retrieving color ID: ${err.message}`);
      return null;
    }
  }));

  for (const item of episodeColors) {
    const [episodeResult] = await query(`SELECT id FROM episodes WHERE LOWER(title) = ?`, [item.episode_title]);
    const episode_id = episodeResult ? episodeResult.id : null;

    if (episode_id === null) {
      console.error(`Episode ID not found for title: ${item.episode_title}`);
      continue;
    }

    for (const color of item.colors) {
      const color_id = colorIDs[colorNames.indexOf(color)];
      if (color_id === null) {
        console.error(`Color ID not found for color: ${color}`);
        continue;
      }

      try {
        await query(`
          INSERT IGNORE INTO episode_colors (episode_id, color_id)
          VALUES (?, ?)
        `, [episode_id, color_id]);
      } catch (err) {
        console.error(`Error inserting episode color: ${err.message}`);
      }
    }
  }
};

module.exports = { loadEpisodeColors };
