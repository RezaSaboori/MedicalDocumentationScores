import React, { useState, useEffect } from 'react';
import { fetchFacultyImpact } from '../../services/dataService';
import FacultyImpactMetricCard from './FacultyImpactMetricCard';

const CARD_STYLE = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' };
const TEXT_STYLE = { color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', fontSize: '0.85rem', textAlign: 'right', lineHeight: 1.9, margin: 0 };

const FacultyImpactChart = ({ faculty }) => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!faculty || faculty === 'all') return;
    setLoading(true);
    fetchFacultyImpact(faculty)
      .then(res => setPayload(Array.isArray(res) ? null : res))
      .finally(() => setLoading(false));
  }, [faculty]);

  if (loading) {
    return (
      <div className="glass u-container u-container--md chart-container" style={CARD_STYLE}>
        در حال محاسبه اثر استاد...
      </div>
    );
  }

  const metrics = payload?.metrics;
  const hasEffectData = metrics && Object.values(metrics).some(m =>
    Object.values(m.windows).some(w => w.cohens_d !== null && w.cohens_d !== undefined)
  );

  if (!hasEffectData) {
    const diagnostics = payload?.diagnostics || [];
    const rotatedList = diagnostics.filter(d => d.rotated);
    const nonRotatedList = diagnostics.filter(d => !d.rotated);

    return (
      <div className="glass u-container u-container--md chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '0.75rem', padding: 'var(--spacing-lg, 1.5rem)' }}>
        <h3 className="chart-title">اثر هیئت علمی بر امتیاز رزیدنت‌ها (اندازه اثر - Cohen's d)</h3>
        <p style={{ ...TEXT_STYLE, textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gray11, #37474f)' }}>
          {payload?.reason || 'داده کافی برای محاسبه اثر وجود ندارد.'}
        </p>
        {diagnostics.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '760px' }}>
            {nonRotatedList.map(d => (
              <li key={d.name} style={TEXT_STYLE}>
                • رزیدنت «{d.name}» در {d.inMonths} ماه ثبت‌شده، تنها تحت سرپرستی «{faculty}» بوده و با استاد دیگری جابجا نشده است؛ بنابراین دوره‌ای برای مقایسه «بدون این استاد» وجود ندارد و اثر استاد قابل تفکیک نیست.
              </li>
            ))}
            {rotatedList.map(d => (
              <li key={d.name} style={TEXT_STYLE}>
                • رزیدنت «{d.name}» دارای چرخش است: {d.inMonths} ماه با «{faculty}» و {d.outMonths} ماه با سایر اساتید{d.otherFaculties.length > 0 ? ` (${d.otherFaculties.join('، ')})` : ''}؛ اما مجموع ماه‌های ثبت‌شده ({d.inMonths + d.outMonths}) برای برآورد پراکندگی کافی نیست (حداقل ۳ ماه لازم است).
              </li>
            ))}
          </ul>
        )}
        <p style={{ ...TEXT_STYLE, textAlign: 'center', fontSize: '0.8rem' }}>
          شرط محاسبه اثر: هر رزیدنت باید حداقل یک دوره با این استاد و یک دوره بدون این استاد و در مجموع حداقل ۳ ماه داده داشته باشد. (رزیدنت‌های دارای چرخش: {payload?.rotatedResidents || 0} از {payload?.totalResidents || 0})
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <FacultyImpactMetricCard
        title="اثر هیئت علمی بر امتیاز رزیدنت‌ها"
        metricData={metrics.PDI}
        globalMax={payload.globalMaxEffect}
      />
      <FacultyImpactMetricCard
        title="اثر هیئت علمی بر امتیاز رزیدنت‌ها (بدون احتساب داده کاذب)"
        metricData={metrics.PDI_noF}
        globalMax={payload.globalMaxEffect}
      />
    </div>
  );
};

export default FacultyImpactChart;