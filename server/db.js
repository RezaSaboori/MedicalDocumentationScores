import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureColumns = (db, tableName, columns) => {
  const existingColumns = new Set(
    db
      .prepare(`PRAGMA table_info(${tableName})`)
      .all()
      .map((column) => column.name)
  );

  Object.entries(columns).forEach(
    ([columnName, columnType]) => {
      if (!existingColumns.has(columnName)) {
        db.exec(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`
        );
      }
    }
  );
};

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
      raw_score REAL,
      calibrated_score REAL,
      raw_score_class INTEGER,
      calibrated_score_class INTEGER,
      reference_sample_count INTEGER,
      completed_weight_sum REAL,
      active_weight_sum REAL,
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

    CREATE TABLE IF NOT EXISTS residents_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      year TEXT
    );

    CREATE TABLE IF NOT EXISTS aggregated_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT, section TEXT, group_fa TEXT,
      members_count INTEGER, review_sign TEXT,
      V INTEGER,
      D INTEGER,

      raw_score REAL,
      calibrated_score REAL,
      raw_score_class REAL,
      calibrated_score_class REAL,
      reference_sample_count REAL,
      completed_weight_sum REAL,
      active_weight_sum REAL,

      Q0 INTEGER,
      Q1 INTEGER,
      Q2 INTEGER,
      Q3 INTEGER,
      Q4 INTEGER,
      Q5 INTEGER,

      combo_status TEXT,
      supervision_rate REAL,
      start_date TEXT, end_date TEXT,
      WQS_adj REAL, COV_adj REAL, LAQ REAL, INT REAL, PDI REAL, flags TEXT,
      FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
    );
  `);
  ensureColumns(db, 'documents', {
    raw_score: 'REAL',
    calibrated_score: 'REAL',
    raw_score_class: 'INTEGER',
    calibrated_score_class: 'INTEGER',
    reference_sample_count: 'INTEGER',
    completed_weight_sum: 'REAL',
    active_weight_sum: 'REAL',
  });

  ensureColumns(db, 'aggregated_scores', {
    raw_score: 'REAL',
    calibrated_score: 'REAL',
    raw_score_class: 'REAL',
    calibrated_score_class: 'REAL',
    reference_sample_count: 'REAL',
    completed_weight_sum: 'REAL',
    active_weight_sum: 'REAL',
    Q0: 'INTEGER',
    Q1: 'INTEGER',
    Q2: 'INTEGER',
    Q3: 'INTEGER',
    Q4: 'INTEGER',
    Q5: 'INTEGER',
  });

  return db;
};