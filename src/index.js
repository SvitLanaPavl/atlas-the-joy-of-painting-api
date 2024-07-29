const express = require('express');
const { loadData } = require('./controllers/load/loadDataController');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.post('/api/load-data', loadData);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
