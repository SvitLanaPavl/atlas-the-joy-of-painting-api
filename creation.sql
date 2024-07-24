USE joy_of_painting;

-- Drop dependent tables first
DROP TABLE IF EXISTS episode_features;
DROP TABLE IF EXISTS episode_colors;

-- Drop main tables
DROP TABLE IF EXISTS features;
DROP TABLE IF EXISTS colors;
DROP TABLE IF EXISTS episodes;

-- Create tables
CREATE TABLE episodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  season INT,
  episode INT,
  broadcast_date DATE,
  youtube_url VARCHAR(255),
  image_url VARCHAR(255)
);

CREATE TABLE colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  hex_value VARCHAR(7)
);

CREATE TABLE episode_colors (
  episode_id INT,
  color_id INT,
  PRIMARY KEY (episode_id, color_id),
  FOREIGN KEY (episode_id) REFERENCES episodes(id),
  FOREIGN KEY (color_id) REFERENCES colors(id)
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE episode_subjects (
  episode_id INT,
  subject_id INT,
  PRIMARY KEY (episode_id, subject_id),
  FOREIGN KEY (episode_id) REFERENCES episodes(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
