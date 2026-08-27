import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { fetchFacultyImpact } from '../../services/dataService';
import ChartTooltip from './ChartTooltip';

const FacultyImpactChart = ({ faculty }) => {
  const [data, setData] = useState([]);
  const [globalMax, setGlobalMax] = useState(0.5);
  const [reason, setReason] = useState(null);
  const [stats, setStats] = useState({ totalResidents: 0, rotatedResidents: 0 });
  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!faculty || faculty === 'all') return;
    setLoading(true);
    fetchFacultyImpact(faculty)
      .then(res => {
        if (Array.isArray(res)) {
          setData(res);
          setGlobalMax(0.5);
          setReason(null);
          setStats({ totalResidents: 0, rotatedResidents: 0 });
          setDiagnostics([]);
        } else {
          setData(res.results || []);
          setGlobalMax(res.globalMaxEffect || 0.5);
          setReason(res.reason || null);
          setStats({
            totalResidents: res.totalResidents || 0,
            rotatedResidents: res.rotatedResidents || 0,
          });
          setDiagnostics(res.diagnostics || []);
        }
      })
      .finally(() => setLoading(false));
  }, [faculty]);

  if (loading) return (
    <div className="glass u-container u-container--md chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
      در حال محاسبه اثر استاد...
    </div>
  );

  const hasEffectData = data.some(d => d.cohens_d !== null && d.cohens_d !== undefined);

  if (!hasEffectData) {
    const rotatedList = diagnostics.filter(d => d.rotated);
    const nonRotatedList = diagnostics.filter(d => !d.rotated);

    return (
      <div className="glass u-container u-container--md chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '0.75rem', padding: 'var(--spacing-lg, 1.5rem)' }}>
        <h3 className="chart-title">اثر هیئت علمی بر رزیدنت‌ها (اندازه اثر - Cohen's d)</h3>
        <p style={{ color: 'var(--color-gray11, #37474f)', fontFamily: 'var(--font-family-base)', fontSize: '0.95rem', fontWeight: 600, textAlign: 'center', margin: 0 }}>
          {reason || 'داده کافی برای محاسبه اثر وجود ندارد.'}
        </p>
        {diagnostics.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '760px' }}>
            {nonRotatedList.map(d => (
              <li key={d.name} style={{ color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', fontSize: '0.85rem', textAlign: 'right', lineHeight: 1.9 }}>
                • رزیدنت «{d.name}» در {d.inMonths} ماه ثبت‌شده، تنها تحت سرپرستی «{faculty}» بوده و با استاد دیگری جابجا نشده است؛ بنابراین دوره‌ای برای مقایسه «بدون این استاد» وجود ندارد و اثر استاد قابل تفکیک نیست.
              </li>
            ))}
            {rotatedList.map(d => (
              <li key={d.name} style={{ color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', fontSize: '0.85rem', textAlign: 'right', lineHeight: 1.9 }}>
                • رزیدنت «{d.name}» دارای چرخش است: {d.inMonths} ماه با «{faculty}» و {d.outMonths} ماه با سایر اساتید{d.otherFaculties.length > 0 ? ` (${d.otherFaculties.join('، ')})` : ''}؛ اما مجموع ماه‌های ثبت‌شده ({d.inMonths + d.outMonths}) برای برآورد پراکندگی کافی نیست (حداقل ۳ ماه لازم است).
              </li>
            ))}
          </ul>
        )}
        <p style={{ color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
          شرط محاسبه اثر: هر رزیدنت باید حداقل یک دوره با این استاد و یک دوره بدون این استاد و در مجموع حداقل ۳ ماه داده داشته باشد. (رزیدنت‌های دارای چرخش: {stats.rotatedResidents} از {stats.totalResidents})
        </p>
      </div>
    );
  }

  const metricLabels = {
    PDI: 'PDI (امتیاز کلی)',
    WQS_adj: 'WQS (کیفیت)',
    LAQ: 'LAQ (بار در برابر کیفیت)',
    INT: 'INT (صحت)'
  };

  const chartData = data
    .filter(d => d.cohens_d !== null && d.cohens_d !== undefined)
    .map(d => ({
      metric: metricLabels[d.metric] || d.metric,
      impact: d.cohens_d,
      delta: d.delta,
      n_in: d.n_in,
      n_out: d.n_out,
      n_residents: d.n_residents || 0
    }));

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">اثر هیئت علمی بر رزیدنت‌ها (اندازه اثر - Cohen's d)</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-gray9, #607d8b)', margin: '0 0 1rem 0', textAlign: 'right' }}>
        مقایسه عملکرد رزیدنت‌ها در دوران سرپرستی این استاد با سایر دوران‌ها (مثبت = بهبود)
      </p>
      <div style={{ height: '300px', direction: 'ltr' }}>
        <ResponsiveBar
          data={chartData}
          keys={['impact']}
          indexBy="metric"
          layout="horizontal"
          margin={{ top: 20, right: 60, bottom: 40, left: 150 }}
          padding={0.4}
          colors={({ value }) => (value >= 0 ? '#10b981' : '#ef4444')}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 5,
            tickRotation: 0,
            legend: "اندازه اثر (Cohen's d)",
            legendPosition: 'middle',
            legendOffset: 30
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 5,
            tickRotation: 0,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor="#ffffff"
          enableGridX={true}
          enableGridY={false}
          minValue={-globalMax}
          maxValue={globalMax}
          markers={[
            {
              axis: 'x',
              value: 0,
              lineStyle: { stroke: 'var(--color-gray6, #cfd8dc)', strokeWidth: 1 },
            }
          ]}
          tooltip={({ value, indexValue, data }) => (
            <ChartTooltip 
              title={indexValue}
              rows={[
                { label: "اندازه اثر (Cohen's d)", value: Number(value).toFixed(3) },
                { label: 'تفاوت میانگین (Delta)', value: Number(data.delta).toFixed(3) },
                { label: 'رزیدنت‌های مقایسه شده', value: data.n_residents || 0 },
                { label: 'میانگین ماه‌های با استاد', value: data.n_residents > 0 ? (data.n_in / data.n_residents).toFixed(1) : 0 },
                { label: 'میانگین ماه‌های بدون استاد', value: data.n_residents > 0 ? (data.n_out / data.n_residents).toFixed(1) : 0 }
              ]}
            />
          )}
          motionConfig="wobbly"
        />
      </div>
    </div>
  );
};

export default FacultyImpactChart;