-- Schema for D1 Database
-- Table: scores
-- Contains a text id as primary key and a score column with default value 0

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  score INTEGER DEFAULT 0
);