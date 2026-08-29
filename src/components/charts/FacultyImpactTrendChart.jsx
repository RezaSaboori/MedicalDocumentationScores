import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import ChartTooltip from './ChartTooltip';

const SERIES_META = [
  { key: 'all', label: 'زمینه: میانگین کل بیمارستان', color: 'var(--color-gray8, #90a4ae)' },
  { key: 'with', label: 'رزیدنت‌های این استاد با ایشان', color: 'var(--color-green, #10b981)' },
  { key: 'without', label: 'رزیدنت‌های این استاد بدون ایشان', color: 'var(--color-orange, #f59e0b)' },
];

const FacultyImpactTrendChart = ({ series }) => {
  const data = (series || []).map(s => ({
    period: s.period,
    all: s.all ?? 0,
    with: s.with ?? 0,
    without: s.without ?? 0,
    raw: s,
  }));

  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) : '—');

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray9, #607d8b)', marginBottom: 4, fontFamily: 'var(--font-family-base)' }}>
        روند میانگین امتیاز در ماه‌ها
      </div>
      <div style={{ height: 180, direction: 'ltr' }}>
        <ResponsiveBar
          data={data}
          keys={['all', 'with', 'without']}
          indexBy="period"
          groupMode="grouped"
          margin={{ top: 8, right: 8, bottom: 28, left: 36 }}
          padding={0.25}
          innerPadding={1}
          colors={({ id }) => SERIES_META.find(s => s.key === id)?.color || 'var(--color-gray8, #90a4ae)'}
          enableLabel={false}
          axisBottom={{ tickSize: 0, tickPadding: 6 }}
          axisLeft={{ tickSize: 0, tickPadding: 6, tickValues: 4 }}
          enableGridX={false}
          enableGridY={true}
          tooltip={({ indexValue, data: barData }) => (
            <ChartTooltip
              title={String(indexValue).startsWith('سال') ? indexValue : `ماه ${indexValue}`}
              rows={SERIES_META.map(m => ({
                label: m.label,
                value: fmt(barData.raw?.[m.key]),
              }))}
            />
          )}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        {SERIES_META.map(m => (
          <span key={m.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--border-radius-container-xs, 8px)', background: m.color, display: 'inline-block' }} />
            {m.label}
          </span>
        ))}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', textAlign: 'center', marginTop: 4, lineHeight: 1.7 }}>
        قضاوت دربارهٔ اثر استاد فقط با مقایسهٔ ستون سبز و نارنجی (همین رزیدنت‌ها در حضور/غیاب استاد) معتبر است؛ ستون خاکستری صرفاً زمینهٔ کل بیمارستان است و ممکن است از هر دو کمتر یا بیشتر باشد.
      </div>
    </div>
  );
};

export default FacultyImpactTrendChart;