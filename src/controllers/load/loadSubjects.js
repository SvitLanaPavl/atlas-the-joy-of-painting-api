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
              subjects.push(key);
            }
          });
          episodeSubjects.push({ episode_id: row.EPISODE, subjects });
        } catch (err) {
          console.error(`Error parsing subjects: ${err.message}`);
        }
      })
      .on('end', async () => {
        try {
          for (const subject of episodeSubjects) {
            for (const name of subject.subjects) {
              if (!subjectsMap.has(name)) {
                await query(`
                  INSERT INTO subjects (name)
                  VALUES (?)
                `, [name]);
                const [subjectResult] = await query(`SELECT id FROM subjects WHERE name = ?`, [name]);
                subjectsMap.set(name, subjectResult ? subjectResult.id : null);
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
