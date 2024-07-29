const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../../db/database');

const loadSubjects = async () => {
  const subjectsMap = new Map();
  const episodeSubjects = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/subjects.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          const subjects = [];
          Object.keys(row).forEach((key) => {
            if (row[key] === '1') {
              subjects.push(key.trim().toLowerCase());
            }
          });
          episodeSubjects.push({ episode_id: row.EPISODE.trim().toLowerCase(), subjects });
        } catch (err) {
          console.error(`Error parsing subjects: ${err.message}`);
        }
      })
      .on('end', async () => {
        try {
          // Get existing subjects from the database
          const existingSubjects = await query(`SELECT id, name FROM subjects`);
          existingSubjects.forEach(({ id, name }) => {
            subjectsMap.set(name.trim().toLowerCase(), id);
          });

          // Insert new subjects into the database and update subjectsMap
          for (const { subjects } of episodeSubjects) {
            for (const name of subjects) {
              if (!subjectsMap.has(name)) {
                await query(`INSERT INTO subjects (name) VALUES (?)`, [name]);
                const [subjectResult] = await query(`SELECT id FROM subjects WHERE name = ?`, [name]);
                if (subjectResult) {
                  subjectsMap.set(name, subjectResult.id);
                } else {
                  console.error(`Failed to retrieve ID for subject: ${name}`);
                }
              }
            }
          }
          resolve({ subjectsMap, episodeSubjects });
        } catch (err) {
          reject(err);
        }
      });
  });
};

module.exports = { loadSubjects };
