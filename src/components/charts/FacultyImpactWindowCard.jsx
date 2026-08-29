import React from 'react';
import FacultyImpactTrendChart from './FacultyImpactTrendChart';
import FacultyImpactCompareBars from './FacultyImpactCompareBars';

const FacultyImpactWindowCard = ({ label, windowData, series, globalMax }) => {
  const d = windowData?.cohens_d;
  const hasD = d !== null && d !== undefined;
  const pct = hasD ? Math.min(Math.abs(d) / (globalMax || 1), 1) * 50 : 0;
  const positive = (d || 0) >= 0;
  const inside = pct >= 15;

  const dLabelStyle = positive
    ? (inside
      ? { left: `calc(50% + ${pct}%)`, transform: 'translate(calc(-100% - 6px), -50%)', color: '#ffffff' }
      : { left: `calc(50% + ${pct}% + 6px)`, transform: 'translateY(-50%)', color: 'var(--color-green, #10b981)' })
    : (inside
      ? { right: `calc(50% + ${pct}%)`, transform: 'translate(calc(100% + 6px), -50%)', color: '#ffffff' }
      : { right: `calc(50% + ${pct}% + 6px)`, transform: 'translateY(-50%)', color: 'var(--color-red, #ef4444)' });

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
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray9, #607d8b)', marginBottom: 4, fontFamily: 'var(--font-family-base)' }}>
              اندازه اثر (Cohen's d)
            </div>
            <div style={{ position: 'relative', height: 26, background: 'var(--color-gray3, #eceff1)', borderRadius: 999 }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--color-gray6, #cfd8dc)' }} />
              <div style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                background: positive ? 'var(--color-green, #10b981)' : 'var(--color-red, #ef4444)',
                ...(positive
                  ? { left: '50%', width: `${pct}%`, borderRadius: '0 999px 999px 0' }
                  : { right: '50%', width: `${pct}%`, borderRadius: '999px 0 0 999px' }),
              }} />
              <span style={{ position: 'absolute', top: '50%', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-family-base)', ...dLabelStyle }}>
                {Number(d).toFixed(3)}
              </span>
            </div>
          </div>

          <FacultyImpactCompareBars
            mode="diverging"
            items={[
              { label: 'میانگین تغییر امتیاز پس از کسر روند زمانی بیمارستان', value: windowData.delta },
              { label: 'تغییر خام', value: windowData.delta_raw },
            ]}
          />

          <FacultyImpactCompareBars
            mode="positive"
            formatter={(v) => Number(v).toFixed(1)}
            items={[
              { label: 'میانگین امتیاز در ماه‌های با این استاد', value: windowData.mean_in, color: 'var(--color-green, #10b981)' },
              { label: 'میانگین امتیاز در ماه‌های بدون این استاد', value: windowData.mean_out, color: 'var(--color-orange, #f59e0b)' },
            ]}
          />

          <div style={{ fontSize: '0.7rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
            رزیدنت‌های مقایسه‌شده: {windowData.n_residents}
          </div>
        </>
      )}

      <FacultyImpactTrendChart series={series} />
    </div>
  );
};

export default FacultyImpactWindowCard;