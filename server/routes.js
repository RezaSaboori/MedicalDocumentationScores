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
      return res.json({
        results: [],
        globalMaxEffect: 0.2,
        reason: 'داده‌ای در پایگاه ثبت نشده است.',
        totalResidents: 0,
        rotatedResidents: 0,
        diagnostics: []
      });
    }

    const metrics = ['PDI', 'WQS_adj', 'LAQ', 'INT'];
    const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const CAP = 3; // winsorize extreme per-resident effect sizes to keep the shared axis readable

    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = (arr) => arr.reduce((a, b) => a + (b - mean(arr)) ** 2, 0) / (arr.length - 1);

    const residentsMap = {};
    rows.forEach(r => {
      const key = normalize(r.name);
      if (!residentsMap[key]) residentsMap[key] = [];
      residentsMap[key].push(r);
    });

    // Effect model: for EACH resident, standardize the months under this faculty
    // against the months without this faculty (within-resident Cohen's d), then
    // average across residents. Works even when the faculty supervised a single
    // resident, as long as that resident has >= 3 recorded months in total.
    const buildFacultyStats = (targetFaculty) => {
      const residents = Object.entries(residentsMap)
        .filter(([, recs]) => recs.some(r => r.faculty === targetFaculty))
        .map(([name, recs]) => {
          const inRecs = recs.filter(r => r.faculty === targetFaculty);
          const outRecs = recs.filter(r => r.faculty !== targetFaculty);
          return {
            name,
            inRecs,
            outRecs,
            inMonths: inRecs.length,
            outMonths: outRecs.length,
            rotated: outRecs.length > 0,
            otherFaculties: [...new Set(outRecs.map(r => r.faculty).filter(Boolean))]
          };
        });

      const results = metrics.map(m => {
        const perResident = [];
        let totalIn = 0;
        let totalOut = 0;

        residents.forEach(res => {
          if (!res.rotated) return;

          const inVals = res.inRecs.map(r => r[m]).filter(v => v != null && !isNaN(v));
          const outVals = res.outRecs.map(r => r[m]).filter(v => v != null && !isNaN(v));
          if (inVals.length === 0 || outVals.length === 0) return;

          totalIn += inVals.length;
          totalOut += outVals.length;

          const n1 = inVals.length;
          const n2 = outVals.length;
          const df = n1 + n2 - 2;
          if (df < 1) return; // >= 3 months required to estimate variability

          const vIn = n1 > 1 ? variance(inVals) : 0;
          const vOut = n2 > 1 ? variance(outVals) : 0;
          const sd = Math.sqrt(((n1 - 1) * vIn + (n2 - 1) * vOut) / df);
          if (sd <= 0) return;

          const delta = mean(inVals) - mean(outVals);
          const d = Math.max(-CAP, Math.min(CAP, delta / sd));
          perResident.push({ delta, d });
        });

        if (perResident.length === 0) {
          return { metric: m, delta: null, cohens_d: null, n_in: totalIn, n_out: totalOut, n_residents: 0 };
        }

        return {
          metric: m,
          delta: Number(mean(perResident.map(p => p.delta)).toFixed(4)),
          cohens_d: Number(mean(perResident.map(p => p.d)).toFixed(4)),
          n_in: totalIn,
          n_out: totalOut,
          n_residents: perResident.length
        };
      });

      const facultyMax = Math.max(0, ...results.map(r => Math.abs(r.cohens_d || 0)));
      return { residents, results, facultyMax };
    };

    const { residents, results } = buildFacultyStats(faculty);
    const totalResidents = residents.length;
    const rotatedResidents = residents.filter(r => r.rotated).length;
    const hasAnyEffect = results.some(r => r.cohens_d !== null);

    let reason = null;
    if (totalResidents === 0) {
      reason = 'هیچ رزیدنتی برای این استاد ثبت نشده است.';
    } else if (rotatedResidents === 0) {
      reason = 'امکان تفکیک اثر استاد وجود ندارد؛ هیچ‌یک از رزیدنت‌های این استاد با استاد دیگری جابجا نشده‌اند.';
    } else if (!hasAnyEffect) {
      reason = 'داده ماهانه برای برآورد پراکندگی کافی نیست؛ برای هر رزیدنت چرخش‌دار حداقل ۳ ماه داده (مجموع دوران با و بدون این استاد) لازم است.';
    }

    // Shared axis: max effect across ALL faculties
    const allFaculties = [...new Set(rows.map(r => r.faculty).filter(Boolean))];
    let globalMax = 0.2;
    allFaculties.forEach(f => {
      const { facultyMax } = buildFacultyStats(f);
      if (facultyMax > globalMax) globalMax = facultyMax;
    });
    globalMax = globalMax * 1.2;

    res.json({
      results,
      globalMaxEffect: Number(globalMax.toFixed(4)),
      reason,
      totalResidents,
      rotatedResidents,
      diagnostics: residents.map(({ inRecs, outRecs, ...rest }) => rest)
    });
  });

  return router;
};