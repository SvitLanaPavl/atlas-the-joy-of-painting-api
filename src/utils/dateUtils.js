// utils/dateUtils.js
const parseDate = (dateString) => {
  // Check if the dateString is empty or invalid
  if (!dateString) return null;

  const date = new Date(dateString);

  // Validate date
  if (isNaN(date.getTime())) {
    console.error(`Invalid date value: ${dateString}`);
    return null; // or handle the error as needed
  }

  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
};

module.exports = { parseDate };
