const { query } = require('../../db/database');

const loadEpisodeSubjects = async (subjectsMap, episodeSubjects) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const item of episodeSubjects) {
        const [episodeResult] = await query(`SELECT id FROM episodes WHERE title = ?`, [item.episode_id]);
        const episode_id = episodeResult ? episodeResult.id : null;

        if (episode_id === null) {
          console.error(`Episode ID not found for title: ${item.episode_id}`);
          continue;
        }

        for (const subject of item.subjects) {
          const subject_id = subjectsMap.get(subject);
          if (subject_id === null) {
            console.error(`Subject ID not found for subject: ${subject}`);
            continue;
          }

          await query(`
            INSERT INTO episode_subjects (episode_id, subject_id)
            VALUES (?, ?)
          `, [episode_id, subject_id]);
          console.log(`Inserted episode_subject: episode_id ${episode_id}, subject_id ${subject_id}`);
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { loadEpisodeSubjects };
