import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA, BASE_FLAG_COLOR, FLAG_PRIORITY } from '../../utils/constants';
import './FlagMembershipChart.css';

const FlagMembershipChart = () => {
  const { data } = useDashboard();
  const d = data.current;

  const chartData = useMemo(() => {
    return FLAG_PRIORITY.map(flag => ({
      flag: BASE_FLAG_FA[flag],
      count: d.filter(row => row.flags.includes(flag)).length,
      color: BASE_FLAG_COLOR[flag]
    })).sort((a, b) => a.count - b.count);
  }, [d]);

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">توزیع پزشکان در گروه های رفتاری</h3>
      <p className="chart-subtitle">(یک پزشک می‌تواند در چند گروه باشد)</p>
      <div className="chart-wrapper">
        <ResponsiveBar
          data={chartData}
          keys={['count']}
          indexBy="flag"
          margin={{ top: 20, right: 40, bottom: 40, left: 120 }}
          padding={0.3}
          layout="horizontal"
          colors={{ datum: 'data.color' }}
          axisBottom={{
            legend: 'تعداد پزشکان',
            legendPosition: 'middle',
            legendOffset: 30
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 12,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor="#ffffff"
          animate={true}
          motionConfig="wobbly"
        />
      </div>
    </div>
  );
};

export default FlagMembershipChart;