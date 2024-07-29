const { query } = require('../db/database');

const clearTables = async () => {
  try {
    // Add the names of your tables here
    const tables = ['episodes', 'colors', 'episode_colors', 'subjects', 'episode_subjects'];

    for (const table of tables) {
      await query(`TRUNCATE TABLE ${table}`);
      console.log(`Cleared table: ${table}`);
    }
  } catch (err) {
    console.error('Error clearing tables:', err);
    throw err; // Rethrow to handle errors in the caller
  }
};

module.exports = { clearTables };
