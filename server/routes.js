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

    if (!rows || rows.length === 0) {
      return res.json({ results: [], globalMaxEffect: 0.2, reason: 'داده‌ای در پایگاه ثبت نشده است.', totalResidents: 0, rotatedResidents: 0 });
    }

    const metrics = ['PDI', 'WQS_adj', 'LAQ', 'INT'];
    const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim();

    // Group resident records by normalized name (built once, shared by all calculations)
    const residentsMap = {};
    rows.forEach(r => {
      const key = normalize(r.name);
      if (!residentsMap[key]) residentsMap[key] = [];
      residentsMap[key].push(r);
    });

    const calcPairedEffect = (targetFaculty) => {
      const results = {};
      let facultyMax = 0;

      metrics.forEach(m => {
        const diffs = [];
        let totalInMonths = 0;
        let totalOutMonths = 0;
        let validResidents = 0;

        Object.values(residentsMap).forEach(resRecords => {
          const inVals = resRecords.filter(r => r.faculty === targetFaculty).map(r => r[m]).filter(v => v != null && !isNaN(v));
          const outVals = resRecords.filter(r => r.faculty !== targetFaculty).map(r => r[m]).filter(v => v != null && !isNaN(v));

          // Only include residents who rotated with AND without this faculty
          if (inVals.length > 0 && outVals.length > 0) {
            const meanIn = inVals.reduce((a, b) => a + b, 0) / inVals.length;
            const meanOut = outVals.reduce((a, b) => a + b, 0) / outVals.length;
            diffs.push(meanIn - meanOut);
            totalInMonths += inVals.length;
            totalOutMonths += outVals.length;
            validResidents++;
          }
        });

        if (validResidents < 2) {
          results[m] = { delta: null, cohens_d: null, n_in: totalInMonths, n_out: totalOutMonths, n_residents: validResidents };
        } else {
          const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
          const variance = diffs.reduce((a, b) => a + (b - meanDiff) ** 2, 0) / (diffs.length - 1);
          const stdDev = Math.sqrt(variance);
          const cohensD = stdDev > 0 ? meanDiff / stdDev : 0;

          results[m] = {
            delta: Number(meanDiff.toFixed(4)),
            cohens_d: Number(cohensD.toFixed(4)),
            n_in: totalInMonths,
            n_out: totalOutMonths,
            n_residents: validResidents
          };
          if (Math.abs(cohensD) > facultyMax) facultyMax = Math.abs(cohensD);
        }
      });
      return { results, facultyMax };
    };

    // --- Diagnostic: why the effect may not be computable for this faculty ---
    const supervisedResidents = Object.entries(residentsMap)
      .filter(([, recs]) => recs.some(r => r.faculty === faculty))
      .map(([name, recs]) => {
        const inMonths = recs.filter(r => r.faculty === faculty).length;
        const outMonths = recs.filter(r => r.faculty !== faculty).length;
        const otherFaculties = [...new Set(
          recs.filter(r => r.faculty !== faculty).map(r => r.faculty).filter(Boolean)
        )];
        return { name, inMonths, outMonths, rotated: outMonths > 0, otherFaculties };
      });

    const totalResidents = supervisedResidents.length;
    const rotatedResidents = supervisedResidents.filter(d => d.rotated).length;

    let reason = null;
    if (totalResidents === 0) {
      reason = 'هیچ رزیدنتی برای این استاد ثبت نشده است.';
    } else if (rotatedResidents === 0) {
      reason = 'امکان تفکیک اثر استاد وجود ندارد؛ هیچ‌یک از رزیدنت‌های این استاد چرخش نداشته‌اند.';
    } else if (rotatedResidents < 2) {
      reason = 'امکان محاسبه اندازه اثر وجود ندارد؛ تنها یک رزیدنت چرخش‌دار وجود دارد و حداقل دو رزیدنت چرخش‌دار لازم است.';
    }

    // Calculate global max effect size across ALL faculties for consistent axis
    const allFaculties = [...new Set(rows.map(r => r.faculty).filter(Boolean))];
    let globalMax = 0.2;

    allFaculties.forEach(f => {
      const { facultyMax } = calcPairedEffect(f);
      if (facultyMax > globalMax) globalMax = facultyMax;
    });

    globalMax = globalMax * 1.2; // Add 20% padding to the axis limit

    // Calculate specifically for the requested faculty
    const { results: facultyResults } = calcPairedEffect(faculty);

    const formattedResults = metrics.map(m => ({
      metric: m,
      ...facultyResults[m]
    }));

    res.json({
      results: formattedResults,
      globalMaxEffect: Number(globalMax.toFixed(4)),
      reason,
      totalResidents,
      rotatedResidents,
      diagnostics: supervisedResidents
    });
  });

  return router;
};