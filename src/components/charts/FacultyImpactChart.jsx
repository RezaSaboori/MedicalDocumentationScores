import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { fetchFacultyImpact } from '../../services/dataService';
import './FacultyImpactChart.css';

const FacultyImpactChart = ({ faculty }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!faculty || faculty === 'all') return;
    setLoading(true);
    fetchFacultyImpact(faculty)
      .then(res => setData(res))
      .finally(() => setLoading(false));
  }, [faculty]);

  if (loading) return <div className="glass chart-card loading">در حال محاسبه اثر استاد...</div>;
  if (data.length === 0 || data.every(d => d.n_in === 0 || d.n_out === 0)) {
    return <div className="glass chart-card empty">داده کافی برای محاسبه اثر وجود ندارد.</div>;
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

  const maxVal = Math.max(...chartData.map(d => Math.abs(d.impact)), 0.2) * 1.2;

  return (
    <div className="glass chart-card">
      <div className="chart-header">
        <h3 className="chart-title">اثر هیئت علمی بر رزیدنت‌ها (Effect Size - Cohen's d)</h3>
        <p className="chart-subtitle">مقایسه عملکرد رزیدنت‌ها در دوران سرپرستی این استاد با سایر دوران‌ها (مثبت = بهبود)</p>
      </div>
      <div className="chart-body" style={{ height: '300px' }}>
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
          minValue={-maxVal}
          maxValue={maxVal}
          markers={[
            {
              axis: 'x',
              value: 0,
              lineStyle: { stroke: '#94a3b8', strokeWidth: 1 },
            }
          ]}
          tooltip={({ value, indexValue, data }) => (
            <div style={{ background: '#1e293b', color: 'white', padding: '8px', borderRadius: '4px', direction: 'rtl' }}>
              <strong>{indexValue}</strong><br />
              Cohen's d: {value.toFixed(2)}<br />
              Delta: {data.delta.toFixed(2)}<br />
              ماه‌های با استاد: {data.n_in} | بدون استاد: {data.n_out}
            </div>
          )}
          motionConfig="wobbly"
        />
      </div>
    </div>
  );
};

export default FacultyImpactChart;