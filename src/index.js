const express = require('express');
const { loadData } = require('./controllers/load/loadDataController');
const { query } = require('./db/database');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.post('/api/load-data', loadData);

// Route to fetch data from the 'episodes' table
app.get('/api/episodes', async (req, res) => {
  try {
    const results = await query('SELECT * FROM episodes');
    res.json(results);
  } catch (err) {
    console.error('Error fetching episodes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to fetch data from the 'colors' table
app.get('/api/colors', async (req, res) => {
  try {
    const results = await query('SELECT * FROM colors');
    res.json(results);
  } catch (err) {
    console.error('Error fetching colors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to fetch data from the 'subjects' table
app.get('/api/subjects', async (req, res) => {
  try {
    const results = await query('SELECT * FROM subjects');
    res.json(results);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
