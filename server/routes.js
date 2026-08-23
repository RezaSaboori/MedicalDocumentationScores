import express from 'express';

export const createRouter = (db) => {
  const router = express.Router();

  // Upload parsed data and save to DB
  router.post('/api/upload', async (req, res) => {
    try {
      const { documents, aggregated, period, startDate, endDate } = req.body;
      
      const existing = await db.get('SELECT id FROM snapshots WHERE period = ?', period);
      if (existing) {
        return res.status(400).json({ error: 'این بازه زمانی قبلاً در پایگاه داده ثبت شده است.' });
      }

      const result = await db.run(
        'INSERT INTO snapshots (period, start_date, end_date) VALUES (?, ?, ?)',
        [period, startDate, endDate]
      );
      const snapshotId = result.lastID;

      const docStmt = await db.prepare(`
        INSERT INTO documents 
        (snapshot_id, visit_id, patient_name, national_id, mobile, doctor_name, doctor_national_id, doctor_medical_code, afrad, center_name, clinic_name, clinic_unique_id, electronic_record, status, date, quality_score, fraud_count, completeness, density, non_repetition, total_chars, total_words, combo_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const doc of documents) {
        await docStmt.run([
          snapshotId, doc.visit_id, doc.patient_name, doc.national_id, doc.mobile,
          doc.doctor_name, doc.doctor_national_id, doc.doctor_medical_code,
          doc.afrad, doc.center_name, doc.clinic_name, doc.clinic_unique_id,
          doc.electronic_record, doc.status, doc.date,
          doc.quality_score, doc.fraud_count, doc.completeness,
          doc.density, doc.non_repetition, doc.total_chars, doc.total_words,
          doc.combo_status
        ]);
      }
      await docStmt.finalize();

      const aggStmt = await db.prepare(`
        INSERT INTO aggregated_scores 
        (snapshot_id, category, name, faculty, section, group_fa, members_count, review_sign, V, D, C, U, avg_chars, avg_words, E, G, A, W, F, Z, W2, W1, combo_status, supervision_rate, quality_score, density_score, start_date, end_date, WQS_adj, COV_adj, LAQ, INT, PDI, PDI_noF, flags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const allAgg = [
        ...aggregated.residents.map(r => ({ ...r, category: 'resident' })),
        ...aggregated.faculty.map(f => ({ ...f, category: 'faculty' }))
      ];

      for (const agg of allAgg) {
        await aggStmt.run([
          snapshotId, agg.category, agg.name, agg.faculty, agg.section, agg.group_fa,
          agg.members_count, agg.review_sign, agg.V, agg.D, agg.C, agg.U, agg.avg_chars, agg.avg_words,
          agg.E, agg.G, agg.A, agg.W, agg.F, agg.Z, agg.W2, agg.W1, agg.combo_status,
          agg.supervision_rate, agg.quality_score, agg.density_score,
          agg.start_date, agg.end_date,
          agg.WQS_adj, agg.COV_adj, agg.LAQ, agg.INT, agg.PDI, agg.PDI_noF, agg.flags
        ]);
      }
      await aggStmt.finalize();

      res.json({ success: true, snapshotId, period });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/api/snapshots', async (req, res) => {
    const snapshots = await db.all('SELECT id, period, start_date, end_date FROM snapshots ORDER BY period DESC');
    res.json(snapshots);
  });

  router.get('/api/dashboard/:period', async (req, res) => {
    const { period } = req.params;
    
    const currentSnapshot = await db.get('SELECT id, period, start_date, end_date FROM snapshots WHERE period = ?', period);
    if (!currentSnapshot) return res.status(404).json({ error: 'Snapshot not found' });

    // Automatically query the latest preceding period for comparison
    const previousSnapshot = await db.get(
      'SELECT id, period, start_date, end_date FROM snapshots WHERE period < ? ORDER BY period DESC LIMIT 1',
      period
    );

    const currentData = await db.all('SELECT * FROM aggregated_scores WHERE snapshot_id = ?', currentSnapshot.id);
    const previousData = previousSnapshot ? await db.all('SELECT * FROM aggregated_scores WHERE snapshot_id = ?', previousSnapshot.id) : [];

    res.json({
      current: { snapshot: currentSnapshot, data: currentData },
      previous: previousSnapshot ? { snapshot: previousSnapshot, data: previousData } : null
    });
  });

  return router;
};