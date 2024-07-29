const parseColors = (colorArray) => {
  return JSON.parse(colorArray.replace(/'/g, '"'));
};

module.exports = { parseColors };
