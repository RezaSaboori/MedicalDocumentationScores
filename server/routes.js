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
      SELECT a.name AS name, a.faculty AS faculty, a.PDI AS PDI, a.PDI_noF AS PDI_noF, s.period AS period
      FROM aggregated_scores a
      JOIN snapshots s ON s.id = a.snapshot_id
      WHERE a.category = 'resident'
    `).all();

    if (!rows || rows.length === 0) {
      return res.json({ globalMaxEffect: 0.2, reason: 'داده‌ای در پایگاه ثبت نشده است.', totalResidents: 0, rotatedResidents: 0, diagnostics: [], periods: [], metrics: null });
    }

    const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const CAP = 3;
    const metrics = ['PDI', 'PDI_noF'];
    const periods = [...new Set(rows.map(r => r.period))].sort();
    const yearOf = (p) => String(p).split('/')[0];

    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const round4 = (v) => Number(v.toFixed(4));

    const residentsMap = {};
    rows.forEach(r => {
      const key = normalize(r.name);
      if (!residentsMap[key]) residentsMap[key] = [];
      residentsMap[key].push(r);
    });

    // Baseline-controlled pooled Cohen's d: each resident's months are centered
    // by that resident's own mean (removes baseline ability), then centered
    // with/without values are pooled across residents. Keeps the sign of d
    // consistent with the direction seen in the trend charts.
    const pooledD = (inVals, outVals) => {
      const n1 = inVals.length;
      const n2 = outVals.length;
      const df = n1 + n2 - 2;
      if (n1 === 0 || n2 === 0 || df < 1) return null;
      const varOf = (arr) => arr.reduce((a, b) => a + (b - mean(arr)) ** 2, 0) / (arr.length - 1);
      const sd = Math.sqrt(((n1 - 1) * varOf(inVals) + (n2 - 1) * varOf(outVals)) / df);
      if (sd <= 0) return null;
      return Math.max(-CAP, Math.min(CAP, (mean(inVals) - mean(outVals)) / sd));
    };

    const buildFacultyStats = (targetFaculty, includeSeries) => {
      const residents = Object.entries(residentsMap)
        .filter(([, recs]) => recs.some(r => r.faculty === targetFaculty))
        .map(([name, recs]) => {
          const inAll = recs.filter(r => r.faculty === targetFaculty);
          const outAll = recs.filter(r => r.faculty !== targetFaculty);
          return {
            name,
            recs,
            inMonths: inAll.length,
            outMonths: outAll.length,
            rotated: outAll.length > 0,
            otherFaculties: [...new Set(outAll.map(r => r.faculty).filter(Boolean))]
          };
        });

      const last = periods[periods.length - 1];
      const windows = {
        year: { in: periods, out: periods },
        threeMonth: { in: periods.slice(-3), out: periods.slice(-3) },
        lastMonth: { in: [last], out: periods.slice(0, -1) }
      };

      const metricStats = {};
      metrics.forEach(m => {
        const windowStats = {};

        Object.entries(windows).forEach(([wKey, w]) => {
          const inSet = new Set(w.in);
          const outSet = new Set(w.out);
          const inC = [];
          const outC = [];
          const deltas = [];
          let totalIn = 0;
          let totalOut = 0;
          let contributors = 0;

          residents.forEach(res => {
            const inVals = res.recs.filter(r => r.faculty === targetFaculty && inSet.has(r.period)).map(r => r[m]).filter(v => v != null && !isNaN(v));
            const outVals = res.recs.filter(r => r.faculty !== targetFaculty && outSet.has(r.period)).map(r => r[m]).filter(v => v != null && !isNaN(v));
            if (inVals.length === 0 || outVals.length === 0) return;
            if (inVals.length + outVals.length - 2 < 1) return;

            const mu = mean([...inVals, ...outVals]);
            inVals.forEach(v => inC.push(v - mu));
            outVals.forEach(v => outC.push(v - mu));
            deltas.push(mean(inVals) - mean(outVals));
            totalIn += inVals.length;
            totalOut += outVals.length;
            contributors++;
          });

          const d = pooledD(inC, outC);

          windowStats[wKey] = d === null
            ? { cohens_d: null, delta: null, n_residents: contributors, n_in: totalIn, n_out: totalOut }
            : { cohens_d: round4(d), delta: round4(mean(deltas)), n_residents: contributors, n_in: totalIn, n_out: totalOut };
        });

        let seriesByWindow = {};
        if (includeSeries) {
          const supervisedNames = new Set(residents.map(r => r.name));
          const mv = (list) => {
            const vals = list.map(r => r[m]).filter(v => v != null && !isNaN(v));
            return vals.length ? round4(mean(vals)) : null;
          };
          const monthly = (periodList) => periodList.map(p => {
            const periodRows = rows.filter(r => r.period === p);
            return {
              period: p,
              all: mv(periodRows),
              with: mv(periodRows.filter(r => r.faculty === targetFaculty)),
              without: mv(periodRows.filter(r => r.faculty !== targetFaculty && supervisedNames.has(normalize(r.name))))
            };
          });
          const years = [...new Set(periods.map(yearOf))].sort();
          seriesByWindow = {
            year: years.map(y => {
              const yearRows = rows.filter(r => yearOf(r.period) === y);
              return {
                period: `سال ${y}`,
                all: mv(yearRows),
                with: mv(yearRows.filter(r => r.faculty === targetFaculty)),
                without: mv(yearRows.filter(r => r.faculty !== targetFaculty && supervisedNames.has(normalize(r.name))))
              };
            }),
            threeMonth: monthly(periods.slice(-3)),
            lastMonth: monthly(periods)
          };
        }

        metricStats[m] = { windows: windowStats, series: seriesByWindow };
      });

      const facultyMax = Math.max(0, ...metrics.flatMap(m => Object.values(metricStats[m].windows).map(w => Math.abs(w.cohens_d || 0))));
      return { residents, metricStats, facultyMax };
    };

    const { residents, metricStats } = buildFacultyStats(faculty, true);
    const totalResidents = residents.length;
    const rotated = residents.filter(r => r.rotated);
    const rotatedResidents = rotated.length;
    const hasAnyEffect = metrics.some(m => Object.values(metricStats[m].windows).some(w => w.cohens_d !== null));

    const faNames = residents.map(r => `«${r.name}»`).join('، ');
    const rotatedNames = rotated.map(r => `«${r.name}»`).join('، ');

    let reason = null;
    if (totalResidents === 0) {
      reason = `برای «${faculty}» هیچ رزیدنتی در ماه‌های ثبت‌شده یافت نشد؛ بنابراین داده‌ای برای برآورد اثر وجود ندارد.`;
    } else if (rotatedResidents === 0) {
      reason = `استاد «${faculty}» ${totalResidents} رزیدنت داشته‌اند (${faNames}). تمامی این رزیدنت‌ها در همهٔ ماه‌های ثبت‌شده تنها تحت سرپرستی همین استاد بوده‌اند و هیچ چرخشی به استاد دیگر نداشته‌اند؛ بدون دورهٔ مقایسه («بدون این استاد») امکان تفکیک اثر استاد از سطح پایهٔ رزیدنت‌ها وجود ندارد.`;
    } else if (!hasAnyEffect) {
      reason = `از ${totalResidents} رزیدنت این استاد، تنها ${rotatedNames} چرخش داشته‌اند، اما مجموع ماه‌های ثبت‌شدهٔ هر رزیدنت چرخش‌دار کمتر از ۳ ماه است؛ برای برآورد پراکندگی و محاسبهٔ اندازهٔ اثر، حداقل ۳ ماه داده (مجموع دوران با و بدون این استاد) برای هر رزیدنت چرخش‌دار لازم است.`;
    }

    const allFaculties = [...new Set(rows.map(r => r.faculty).filter(Boolean))];
    let globalMax = 0.2;
    allFaculties.forEach(f => {
      const { facultyMax } = buildFacultyStats(f, false);
      if (facultyMax > globalMax) globalMax = facultyMax;
    });
    globalMax = globalMax * 1.2;

    res.json({
      globalMaxEffect: round4(globalMax),
      reason,
      totalResidents,
      rotatedResidents,
      diagnostics: residents.map(({ recs, ...rest }) => rest),
      periods,
      metrics: metricStats
    });
  });

  return router;
};