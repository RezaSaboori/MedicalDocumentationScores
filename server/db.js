import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');

export const initializeDB = () => {
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL UNIQUE,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      visit_id TEXT, patient_name TEXT, national_id TEXT, mobile TEXT,
      doctor_name TEXT, doctor_national_id TEXT, doctor_medical_code TEXT,
      afrad TEXT, center_name TEXT, clinic_name TEXT, clinic_unique_id TEXT,
      electronic_record TEXT, status TEXT, date TEXT,
      quality_score REAL, fraud_count INTEGER, completeness REAL,
      density REAL, non_repetition REAL, total_chars INTEGER, total_words INTEGER,
      combo_status TEXT,
      FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
    );

    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      year TEXT,
      FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
    );

    CREATE TABLE IF NOT EXISTS aggregated_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT, section TEXT, group_fa TEXT,
      members_count INTEGER, review_sign TEXT,
      V INTEGER, D INTEGER, C REAL, U REAL, avg_chars REAL, avg_words REAL,
      E INTEGER, G INTEGER, A INTEGER, W INTEGER, F INTEGER, Z INTEGER,
      W2 INTEGER, W1 INTEGER, combo_status TEXT,
      supervision_rate REAL, quality_score REAL, density_score REAL,
      start_date TEXT, end_date TEXT,
      WQS_adj REAL, COV_adj REAL, LAQ REAL, INT REAL, PDI REAL, PDI_noF REAL, flags TEXT,
      FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
    );
  `);

  return db;
};