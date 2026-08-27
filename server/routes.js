import express from 'express';

export const createRouter = (db) => {
  const router = express.Router();

  router.post('/api/upload', (req, res) => {
    try {
      const { documents, aggregated, period, startDate, endDate } = req.body;

      if (!period || period === 'unknown') {
        return res.status(400).json({
          error: 'دوره زمانی از تاریخ داده استخراج نشد.',
        });
      }

      const existing = db.prepare('SELECT id FROM snapshots WHERE period = ?').get(period);
      if (existing) {
        return res.status(400).json({ error: 'این بازه زمانی قبلاً در پایگاه داده ثبت شده است.' });
      }

      db.exec('BEGIN TRANSACTION');

      try {
        const snapshotStmt = db.prepare('INSERT INTO snapshots (period, start_date, end_date) VALUES (?, ?, ?)');
        const snapshotInfo = snapshotStmt.run(period, startDate, endDate);
        const snapshotId = Number(snapshotInfo.lastInsertRowid);

        const docStmt = db.prepare(`
          INSERT INTO documents 
          (snapshot_id, visit_id, patient_name, national_id, mobile, doctor_name, doctor_national_id, doctor_medical_code, afrad, center_name, clinic_name, clinic_unique_id, electronic_record, status, date, quality_score, fraud_count, completeness, density, non_repetition, total_chars, total_words, combo_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const doc of documents) {
          docStmt.run(
            snapshotId, doc.visit_id, doc.patient_name, doc.national_id, doc.mobile,
            doc.doctor_name, doc.doctor_national_id, doc.doctor_medical_code,
            doc.afrad, doc.center_name, doc.clinic_name, doc.clinic_unique_id,
            doc.electronic_record, doc.status, doc.date,
            doc.quality_score, doc.fraud_count, doc.completeness,
            doc.density, doc.non_repetition, doc.total_chars, doc.total_words,
            doc.combo_status
          );
        }

      const residentsStmt = db.prepare('INSERT INTO residents (snapshot_id, name, year) VALUES (?, ?, ?)');
      const masterUpsertStmt = db.prepare(
        'INSERT INTO residents_master (name, year) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET year = excluded.year'
      );
      for (const res of (req.body.residentsList || [])) {
        residentsStmt.run(snapshotId, res.name, res.year || null);
        masterUpsertStmt.run(res.name, res.year || null);
      }

      const aggStmt = db.prepare(`
          INSERT INTO aggregated_scores 
          (snapshot_id, category, name, faculty, section, group_fa, members_count, review_sign, V, D, C, U, avg_chars, avg_words, E, G, A, W, F, Z, W2, W1, combo_status, supervision_rate, quality_score, density_score, start_date, end_date, WQS_adj, COV_adj, LAQ, INT, PDI, PDI_noF, flags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const allAgg = [
          ...aggregated.residents.map(r => ({ ...r, category: 'resident' })),
          ...aggregated.faculty.map(f => ({ ...f, category: 'faculty' }))
        ];

        for (const agg of allAgg) {
          aggStmt.run(
            snapshotId, agg.category, agg.name, agg.faculty, agg.section, agg.group_fa,
            agg.members_count, agg.review_sign, agg.V, agg.D, agg.C, agg.U, agg.avg_chars, agg.avg_words,
            agg.E, agg.G, agg.A, agg.W, agg.F, agg.Z, agg.W2, agg.W1, agg.combo_status,
            agg.supervision_rate, agg.quality_score, agg.density_score,
            agg.start_date, agg.end_date,
            agg.WQS_adj, agg.COV_adj, agg.LAQ, agg.INT, agg.PDI, agg.PDI_noF, agg.flags
          );
        }

        db.exec('COMMIT');
        res.json({ success: true, snapshotId, period });
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/api/snapshots', (req, res) => {
    const snapshots = db.prepare('SELECT id, period, start_date, end_date FROM snapshots ORDER BY period DESC').all();
    res.json(snapshots);
  });

  router.get('/api/dashboard/:period', (req, res) => {
    const { period } = req.params;
    
    const currentSnapshot = db.prepare('SELECT id, period, start_date, end_date FROM snapshots WHERE period = ?').get(period);
    if (!currentSnapshot) return res.status(404).json({ error: 'Snapshot not found' });

    const previousSnapshot = db.prepare(
      'SELECT id, period, start_date, end_date FROM snapshots WHERE period < ? ORDER BY period DESC LIMIT 1'
    ).get(period);

    const currentData = db.prepare('SELECT * FROM aggregated_scores WHERE snapshot_id = ?').all(currentSnapshot.id);
    const previousData = previousSnapshot ? db.prepare('SELECT * FROM aggregated_scores WHERE snapshot_id = ?').all(previousSnapshot.id) : [];

    res.json({
      current: { snapshot: currentSnapshot, data: currentData },
      previous: previousSnapshot ? { snapshot: previousSnapshot, data: previousData } : null
    });
  });

  router.get('/api/residents/:period', (req, res) => {
    const { period } = req.params;
    const snapshot = db.prepare('SELECT id FROM snapshots WHERE period = ?').get(period);
    if (!snapshot) return res.json([]);
    const residents = db.prepare('SELECT name, year FROM residents WHERE snapshot_id = ?').all(snapshot.id);
    res.json(residents);
  });

  router.get('/api/residents-master', (req, res) => {
    const rows = db.prepare('SELECT name, year FROM residents_master ORDER BY name').all();
    res.json(rows);
  });

  router.post('/api/residents-master', (req, res) => {
    const list = Array.isArray(req.body) ? req.body : req.body.residentsList || [];

    db.exec('BEGIN TRANSACTION');
    try {
      db.exec('DELETE FROM residents_master');
      const stmt = db.prepare('INSERT INTO residents_master (name, year) VALUES (?, ?)');
      for (const res of list) {
        stmt.run(res.name, res.year || null);
      }
      db.exec('COMMIT');
      res.json({ success: true, count: list.length });
    } catch (err) {
      db.exec('ROLLBACK');
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/api/faculty-impact/:faculty', (req, res) => {
    const { faculty } = req.params;
    
    const rows = db.prepare(`
      SELECT name, faculty, PDI, WQS_adj, LAQ, INT
      FROM aggregated_scores
      WHERE category = 'resident'
    `).all();

    if (!rows || rows.length === 0) return res.json({ results: [], globalMaxEffect: 0.2 });

    // --- Calculate global max effect size across ALL faculties for consistent axis ---
    const allFaculties = [...new Set(rows.map(r => r.faculty).filter(Boolean))];
    let globalMax = 0.2; // Minimum baseline

    const metrics = ['PDI', 'WQS_adj', 'LAQ', 'INT'];

    const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr => arr.reduce((a, b) => a + (b - mean(arr)) ** 2, 0) / (arr.length - 1);

    allFaculties.forEach(f => {
      const facResidents = new Set(rows.filter(r => r.faculty === f).map(r => r.name));
      const fRelevant = rows.filter(r => facResidents.has(r.name));
      const fInRot = fRelevant.filter(r => r.faculty === f);
      const fOutRot = fRelevant.filter(r => r.faculty !== f);

      metrics.forEach(m => {
        const inVals = fInRot.map(r => r[m]).filter(v => v != null && !isNaN(v));
        const outVals = fOutRot.map(r => r[m]).filter(v => v != null && !isNaN(v));
        const n1 = inVals.length;
        const n2 = outVals.length;
        if (n1 < 2 || n2 < 2) return;

        const muIn = mean(inVals);
        const muOut = mean(outVals);
        const varIn = variance(inVals);
        const varOut = variance(outVals);

        const pooledVar = ((n1 - 1) * varIn + (n2 - 1) * varOut) / (n1 + n2 - 2);
        const pooledSD = Math.sqrt(pooledVar);
        if (pooledSD > 0) {
          const d = Math.abs((muIn - muOut) / pooledSD);
          if (d > globalMax) globalMax = d;
        }
      });
    });
    // Add 20% padding to the global max
    globalMax = globalMax * 1.2;
    // ---------------------------------------------------------------------------

    const residentsWithFaculty = new Set(
      rows.filter(r => r.faculty === faculty).map(r => r.name)
    );

    const relevantRows = rows.filter(r => residentsWithFaculty.has(r.name));
    const inRot = relevantRows.filter(r => r.faculty === faculty);
    const outRot = relevantRows.filter(r => r.faculty !== faculty);

    const results = metrics.map(m => {
      const inVals = inRot.map(r => r[m]).filter(v => v != null && !isNaN(v));
      const outVals = outRot.map(r => r[m]).filter(v => v != null && !isNaN(v));

      const n1 = inVals.length;
      const n2 = outVals.length;

      if (n1 === 0 || n2 === 0) return { metric: m, delta: null, cohens_d: null, n_in: n1, n_out: n2 };

      const muIn = mean(inVals);
      const muOut = mean(outVals);
      
      const varIn = n1 > 1 ? variance(inVals) : 0;
      const varOut = n2 > 1 ? variance(outVals) : 0;

      const pooledVar = (n1 + n2 - 2) > 0 ? ((n1 - 1) * varIn + (n2 - 1) * varOut) / (n1 + n2 - 2) : 0;
      const pooledSD = Math.sqrt(pooledVar);

      const delta = muIn - muOut;
      const cohensD = pooledSD > 0 ? delta / pooledSD : 0;

      return {
        metric: m,
        delta: Number(delta.toFixed(4)),
        cohens_d: Number(cohensD.toFixed(4)),
        n_in: n1,
        n_out: n2
      };
    });

    res.json({ results, globalMaxEffect: Number(globalMax.toFixed(4)) });
  });

  return router;
};