const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../../db/database');
const { parseColors } = require('../../utils/colorUtils');

const loadColors = async () => {
  const colorsMap = new Map();
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/colors.csv')
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const colors = parseColors(row.colors);
          const colorHexes = parseColors(row.color_hex);
          colors.forEach((color, index) => {
            color = color.toLowerCase(); // Convert color to lowercase
            if (!colorsMap.has(color)) {
              colorsMap.set(color, colorHexes[index]);
            }
          });
        } catch (err) {
          console.error(`Error parsing colors: ${err.message}`);
        }
      })
      .on('end', async () => {
        try {
          for (const [name, hex] of colorsMap.entries()) {
            await query(`
              INSERT INTO colors (name, hex_value)
              VALUES (?, ?)
            `, [name, hex]);
          }
          resolve(colorsMap);
        } catch (err) {
          reject(err);
        }
      });
  });
};

module.exports = { loadColors };
