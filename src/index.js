const express = require('express');
const { loadData } = require('./controllers/load/loadDataController');
const { query } = require('./db/database');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.post('/api/load-data', loadData);

// Route to fetch data from the 'episodes' table with filtering
app.get('/api/episodes', async (req, res) => {
  const { month, subject, color, filterType = 'all' } = req.query;

  try {
    let queryStr = `
      SELECT DISTINCT episodes.*
      FROM episodes
      LEFT JOIN episode_colors ON episodes.id = episode_colors.episode_id
      LEFT JOIN colors ON episode_colors.color_id = colors.id
      LEFT JOIN episode_subjects ON episodes.id = episode_subjects.episode_id
      LEFT JOIN subjects ON episode_subjects.subject_id = subjects.id
      WHERE 1=1
    `;
    let queryParams = [];

    // Filter by month of original broadcast
    if (month) {
      queryStr += ' AND MONTHNAME(episodes.broadcast_date) = ?';
      queryParams.push(month);
    }

    // Filter by subject
    if (subject) {
      queryStr += ` AND subjects.name LIKE ?`;
      queryParams.push(`%${subject}%`);
    }

    // Filter by color
    if (color) {
      queryStr += ` AND colors.name LIKE ?`;
      queryParams.push(`%${color}%`);
    }

    const results = await query(queryStr, queryParams);
    res.json(results);
  } catch (err) {
    console.error('Error fetching filtered episodes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
