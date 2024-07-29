const { query } = require('../../db/database');

const loadEpisodeSubjects = async (subjectsMap, episodeSubjects) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const item of episodeSubjects) {
        // Extract season and episode numbers from the episode identifier
        const match = item.episode_id.match(/S(\d+)E(\d+)/i);
        if (!match) {
          console.error(`Invalid episode identifier format: ${item.episode_id}`);
          continue;
        }

        const season = parseInt(match[1], 10);
        const episodeNum = parseInt(match[2], 10);

        // Fetch the corresponding episode title based on season and episode number
        const [episodeResult] = await query(`
          SELECT id, title FROM episodes WHERE season = ? AND episode = ?
        `, [season, episodeNum]);

        if (!episodeResult) {
          console.error(`Episode not found for season ${season}, episode ${episodeNum}`);
          continue;
        }

        const { id: episode_id, title } = episodeResult;

        // Log the found episode for verification
        console.log(`Matched episode: ${title} (Season ${season}, Episode ${episodeNum}) with ID ${episode_id}`);

        for (const subject of item.subjects) {
          // Normalize subject name for case-insensitive matching
          if (!subject) {
            console.error(`Invalid subject: ${subject}`);
            continue;
          }

          const normalizedSubject = subject.trim().toLowerCase();
          const subject_id = subjectsMap.get(normalizedSubject);

          if (subject_id === undefined) {
            console.error(`Subject ID not found for subject: ${subject}`);
            continue;
          }

          try {
            await query(`
              INSERT INTO episode_subjects (episode_id, subject_id)
              VALUES (?, ?)
            `, [episode_id, subject_id]);
            console.log(`Inserted episode_subject: episode_id ${episode_id}, subject_id ${subject_id}`);
          } catch (err) {
            console.error(`Error inserting episode_subject: ${err.message}`);
          }
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { loadEpisodeSubjects };
