import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { fetchFacultyImpact } from '../../services/dataService';
import ChartTooltip from './ChartTooltip';

const FacultyImpactChart = ({ faculty }) => {
  const [data, setData] = useState([]);
  const [globalMax, setGlobalMax] = useState(0.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!faculty || faculty === 'all') return;
    setLoading(true);
    fetchFacultyImpact(faculty)
      .then(res => {
        if (Array.isArray(res)) {
          // Fallback for old API format
          setData(res);
          setGlobalMax(0.5);
        } else {
          setData(res.results || []);
          setGlobalMax(res.globalMaxEffect || 0.5);
        }
      })
      .finally(() => setLoading(false));
  }, [faculty]);

  if (loading) return (
    <div className="glass u-container u-container--md chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
      در حال محاسبه اثر استاد...
    </div>
  );
  
  if (data.length === 0 || data.every(d => d.n_in === 0 || d.n_out === 0)) {
    return (
      <div className="glass u-container u-container--md chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        داده کافی برای محاسبه اثر وجود ندارد.
      </div>
    );
  }

  const metricLabels = {
    PDI: 'PDI (امتیاز کلی)',
    WQS_adj: 'WQS (کیفیت)',
    LAQ: 'LAQ (بار در برابر کیفیت)',
    INT: 'INT (صحت)'
  };

  const chartData = data.map(d => ({
    metric: metricLabels[d.metric] || d.metric,
    impact: d.cohens_d,
    delta: d.delta,
    n_in: d.n_in,
    n_out: d.n_out
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
                { label: 'ماه‌های با استاد', value: data.n_in },
                { label: 'ماه‌های بدون استاد', value: data.n_out }
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