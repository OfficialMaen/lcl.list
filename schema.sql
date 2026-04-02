-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  score INTEGER DEFAULT 0
);

-- Submissions table
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level_id TEXT NOT NULL,
  creator TEXT NOT NULL,
  video TEXT NOT NULL
);

-- Leaderboard table
CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level_id TEXT NOT NULL,
  creator TEXT NOT NULL,
  video TEXT NOT NULL,
  position INTEGER DEFAULT 0
);