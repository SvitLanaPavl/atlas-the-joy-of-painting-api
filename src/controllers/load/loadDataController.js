const { clearTables } = require('../../utils/clearTables');
const { loadEpisodes } = require('./loadEpisodes');
const { loadColors } = require('./loadColors');
const { loadEpisodeColors } = require('./loadEpisodeColors');
const { loadSubjects } = require('./loadSubjects');
const { loadEpisodeSubjects } = require('./loadEpisodeSubjects');

const loadData = async (req, res) => {
  try {
    await clearTables(); // Clear tables before loading new data
    console.log('Tables cleared.');

    await loadEpisodes();
    console.log('Episodes loaded.');

    const colorMap = await loadColors();
    console.log('Colors loaded.');

    await loadEpisodeColors(colorMap);
    console.log('Episode colors loaded.');

    const { subjectsMap, episodeSubjects } = await loadSubjects();
    console.log('Subjects loaded.');

    await loadEpisodeSubjects(subjectsMap, episodeSubjects);
    console.log('Episode subjects loaded.');

    res.send('Data loading initiated.');
  } catch (err) {
    console.error('Error loading data:', err);
    res.status(500).send('Error loading data: ' + err.message);
  }
};

module.exports = { loadData };
