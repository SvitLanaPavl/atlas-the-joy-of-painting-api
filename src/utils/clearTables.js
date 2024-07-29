const { query } = require('../db/database');

const clearTables = async () => {
  try {
    // Define the order of table deletion
    const tables = [
      'episode_colors', // Child tables first
      'episode_subjects',
      'episodes',       // Parent tables last
      'colors',
      'subjects'
    ];

    // Disable foreign key checks
    await query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks disabled.');

    for (const table of tables) {
      await query(`DELETE FROM ${table}`);
      console.log(`Cleared table: ${table}`);
    }

    // Re-enable foreign key checks
    await query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks re-enabled.');

  } catch (err) {
    console.error('Error clearing tables:', err);
    throw err; // Rethrow to handle errors in the caller
  }
};

module.exports = { clearTables };
