import React from 'react';
import FacultyImpactTrendChart from './FacultyImpactTrendChart';

const FacultyImpactWindowCard = ({ label, windowData, series, globalMax, withoutLabel }) => {
  const d = windowData?.cohens_d;
  const delta = windowData?.delta;
  const hasD = d !== null && d !== undefined;
  const pct = hasD ? Math.min(Math.abs(d) / (globalMax || 1), 1) * 50 : 0;
  const positive = (d || 0) >= 0;

  return (
    <div
      className="glass"
      style={{
        padding: 'var(--spacing-md, 12px)',
        borderRadius: 'var(--border-radius-container-xs, 8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm, 8px)',
      }}
    >
      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray12, #263238)', fontFamily: 'var(--font-family-base)' }}>
        {label}
      </h4>

      {!hasD ? (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', lineHeight: 1.8 }}>
          {windowData?.reason || 'داده کافی برای محاسبه اثر در این بازه وجود ندارد.'}
        </p>
      ) : (
        <>
          {windowData?.method === 'within' && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-green, #10b981)', fontFamily: 'var(--font-family-base)' }}>
              برآورد علّی: مقایسهٔ همان رزیدنت‌ها در حضور و غیاب این استاد
            </div>
          )}
          {windowData?.method === 'between' && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-orange, #f59e0b)', fontFamily: 'var(--font-family-base)', lineHeight: 1.7 }}>
              برآورد توصیفی: رزیدنت‌های این استاد چرخش نکرده‌اند؛ این عدد مقایسه با سایر رزیدنت‌های هم‌دوره است و اثر علّی استاد نیست.
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray9, #607d8b)', marginBottom: 4, fontFamily: 'var(--font-family-base)' }}>
              اندازه اثر (Cohen's d)
            </div>
            <div style={{ position: 'relative', height: 26, background: 'var(--color-gray3, #eceff1)', borderRadius: 'var(--border-radius-container-xs, 8px)' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--color-gray6, #cfd8dc)' }} />
              <div style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                borderRadius: 'var(--border-radius-container-xs, 8px)',
                background: positive ? 'var(--color-green, #10b981)' : 'var(--color-red, #ef4444)',
                ...(positive ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }),
              }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-family-base)',
                color: positive ? 'var(--color-green, #10b981)' : 'var(--color-red, #ef4444)',
                ...(positive ? { left: `calc(50% + ${pct}% + 6px)` } : { right: `calc(50% + ${pct}% + 6px)` }),
              }}>
                {Number(d).toFixed(3)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
            میانگین تغییر امتیاز رزیدنت‌ها:{' '}
            <strong style={{ color: (delta || 0) >= 0 ? 'var(--color-green, #10b981)' : 'var(--color-red, #ef4444)' }}>
              {(delta || 0) >= 0 ? '+' : ''}{Number(delta).toFixed(2)}
            </strong>
            {' '}(رزیدنت‌های مقایسه‌شده: {windowData.n_residents})
          </div>
          {windowData.mean_in !== null && windowData.mean_in !== undefined && windowData.mean_out !== null && windowData.mean_out !== undefined && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
              میانگین امتیاز در ماه‌های با این استاد: {Number(windowData.mean_in).toFixed(1)} | میانگین امتیاز در ماه‌های بدون این استاد: {Number(windowData.mean_out).toFixed(1)}
            </div>
          )}
        </>
      )}

      <FacultyImpactTrendChart series={series} withoutLabel={withoutLabel} />
    </div>
  );
};

export default FacultyImpactWindowCard;