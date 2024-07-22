-- Creates tables
-- Tables are based on the information in data files
USE joy_of_painting;

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
  hex_value varchar(7)
);

CREATE TABLE episode_colors (
  episode_id INT,
  color_id INT,
  PRIMARY KEY (episode_id, color_id),
  FOREIGN KEY (episode_id) REFERENCES episodes(id),
  FOREIGN KEY (color_id) REFERENCES colors(id)
);

CREATE TABLE features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE episode_features (
  episode_id INT,
  feature_id INT,
  PRIMARY KEY (episode_id, feature_id),
  FOREIGN KEY (episode_id) REFERENCES episodes(id),
  FOREIGN KEY (feature_id) REFERENCES features(id)
);
