import React from 'react';
import FacultyImpactTrendChart from './FacultyImpactTrendChart';

const FacultyImpactWindowCard = ({ label, windowData, series, globalMax }) => {
  const d = windowData?.cohens_d;
  const delta = windowData?.delta;
  const hasD = d !== null && d !== undefined;
  const pct = hasD ? Math.min(Math.abs(d) / (globalMax || 1), 1) * 50 : 0;
  const positive = (d || 0) >= 0;

  return (
    <div className="glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray11, #37474f)', fontFamily: 'var(--font-family-base)' }}>
        {label}
      </h4>

      {!hasD ? (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
          داده کافی برای محاسبه اثر در این بازه وجود ندارد.
        </p>
      ) : (
        <>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray9, #607d8b)', marginBottom: 4, fontFamily: 'var(--font-family-base)' }}>
              اندازه اثر (Cohen's d)
            </div>
            <div style={{ position: 'relative', height: 26, background: 'var(--color-gray3, #eceff1)', borderRadius: 6 }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--color-gray6, #cfd8dc)' }} />
              <div style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                borderRadius: 4,
                background: positive ? '#10b981' : '#ef4444',
                ...(positive ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }),
              }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-family-base)',
                color: positive ? '#047857' : '#b91c1c',
                ...(positive ? { left: `calc(50% + ${pct}% + 6px)` } : { right: `calc(50% + ${pct}% + 6px)` }),
              }}>
                {Number(d).toFixed(3)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
            میانگین تغییر امتیاز رزیدنت‌ها:{' '}
            <strong style={{ color: (delta || 0) >= 0 ? '#047857' : '#b91c1c' }}>
              {(delta || 0) >= 0 ? '+' : ''}{Number(delta).toFixed(2)}
            </strong>
            {' '}(رزیدنت‌های مقایسه‌شده: {windowData.n_residents})
          </div>
        </>
      )}

      <FacultyImpactTrendChart series={series} />
    </div>
  );
};

export default FacultyImpactWindowCard;