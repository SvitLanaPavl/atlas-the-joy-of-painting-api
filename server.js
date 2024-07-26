const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Execute queries
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve (results);
      }
    });
  });
};

// Parse Color array
const parseColors = (colorArray) => {
  return JSON.parse(colorArray.replace(/'/g, '"'));
};


// Loading Data
const episodes = [];
app.post('/api/load-data', async (req, res) => {
  try {
    //Load Episodes
    fs.createReadStream('data/episodes.csv')
    .pipe(csv())
    .on('data', (row) => {
      episodes.push(row);
    })
    .on('end', async () => {
      for (const episode of episodes) {
        await query(`
        INSERT INTO episodes (title, broadcast_date)
        VALUES (?, ?)
        `, [episode.TITLE, new Date(episode.APPLE_FRAME)]);
      }
    });
  
    // Load colors and episode colors
    const colorsMap = new Map();
    const episodeColors = [];
    fs.createReadStream('data/colors')
    .pipe(csv())
    .on('data', (row) => {
      const colors = parseColors(row.colors);
      const colorHexes = parseColors(row.color_hex);
      colors.forEach((color, index) => {
        if (!colorsMap.has(color)) {
          colorsMap.set(color, colorHexes[index]);
        }
      });
      episodeColors.push({ episode_id: row.painting_index, colors });
    })
    .on('end', async () => {
      // Insert colors
      for (const [name, hex] of colorsMap.entries()) {
        await query(`
        INSERT INTO colors (name, hex_value)
        VALUES (?, ?)
        `, [name, hex]);
      }
      // Map colors to IDs
      const colorNames = Array.from(colorsMap.keys());
      const colorIds = await Promise.all(colorNames.map(async (name) => {
        const [result] = await query(`SELECT id FROM colors WHERE name = ?`, [name]);
        return result.id;
      }));
    
      // Insert episode_colors
      episodeColors.forEach(async (item) => {
        const episodeID = await query(`SELECT id FROM episodes WHERE painting_index = ?`, [item.episode_id]);
        const episode_id = episodeID[0]?.id;
      
        item.colors.forEach(async (color, index) => {
          const color_id = colorIds[colorNames.indexOf(color)];
          await query(`
          INSERT INTO episode_colors (episode_id, color_id)
          VALUES (?, ?)
          `, [episode_id, color_id]);
        });
      });
    });
  
  // Load subjects and episode subjects
  const subjectsMap = new Map();
  const episodeSubjects = [];
  fs.createReadStream('data/subjects.csv')
  .pipe(csv())
  .on('data', (row) => {
    const subjects = [];
    Object.keys(row).forEach((key) => {
      if (row[key] === '1') {
        subjects.push(key);
      }
    });
    episodeSubjects.push({ episode_id: row.EPISODE, subjects });
  })
  .on('end', async () => {
    // Insert subjects
    for (const subject of episodeSubjects) {
      subject.subjects.forEach(async (name) => {
        if (!subjectsMap.has(name)) {
          await query(`
          INSERT INTO subjects (name)
          VALUES (?)
          ` [name]);
          subjectsMap.set(name, (await query(`SELECT id FROM subjects WHERE name = ?`, [name]))[0]?.id);
        }
      });
    }
    // Insert episode_subjects
    episodeSubjects.forEach(async (item) => {
      const episodeID = await query(`SELECT id FROM episodes WHERE title = ?`, [item.episode_id]);
      const episode_id = episodeID[0]?.id;

      item.subjects.forEach(async (subject) => {
        const subject_id = subjectsMap.get(subject);
        await query(`
        INSERT INTO episode_subjects (episode_id, subject_id)
        VALUES (?, ?)
        `, [episode_id, subject_id]);
      });
    });
  });
  res.send('Data loading initiated.');
  } catch (err) {
    res.status(500).send('Error loading data ' + err.message);
  }
});

// API to filter episodes
app.get('/api/episodes', async (req, res) => {
  try {
    let queryStr = 'SELECT * FROM episodes e';
    const conditions = [];
    const params = [];

    const month = req.query.month;
    if (month) {
      queryStr += ' JOIN episode_broadcast eb ON e.id = eb.episode_id';
      conditions.push('MONTHNAME(eb.broadcast_date) = ?');
      params.push(month);
    }
    const subject = req.query.subject;
    if (subject) {
      queryStr += ' JOIN episode_subjects es ON e.id = es.episode_id JOIN subjects s ON es.subject_id = s.id';
      conditions.push('s.name = ?');
      params.push(subject);
    }

    const colors = req.query.colors;
    if (colors) {
      const colorList = colors.split(',');
      queryStr += ' JOIN episode_colors ec ON e.id = ec.episode_id JOIN colors c ON ec.color_id = c.id';
      conditions.push('c.name IN (' + colorList.map(() => '?').join(',') + ')');
      params.push(...colorList);
    }
  
    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    const episodes = await query(queryStr, params);
    res.json(episodes);
  } catch (err) {
    res.status(500).send('Error fetching episodes: ' + err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
  