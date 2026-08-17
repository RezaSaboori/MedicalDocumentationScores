import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA, BASE_FLAG_COLOR, FLAG_PRIORITY } from '../../utils/constants';
import { Skeleton } from '../ui/Skeleton';
import './FlagMembershipChart.css';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';

const EMPTY_STATE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '260px',
  color: 'var(--color-gray8)',
  fontFamily: 'var(--font-family-base)',
};

const FlagMembershipChart = () => {
  const { data, loading } = useDashboard();
  const d = data.current;

  const chartData = useMemo(() => {
    return FLAG_PRIORITY.map(flag => ({
      flag: BASE_FLAG_FA[flag],
      count: d.filter(row => row.flags.includes(flag)).length,
      color: BASE_FLAG_COLOR[flag]
    })).sort((a, b) => a.count - b.count);
  }, [d]);

  if (loading) {
    return (
      <div className="glass u-container u-container--md chart-container">
        <Skeleton width="60%" height="1.2rem" />
        <Skeleton width="100%" height="260px" />
      </div>
    );
  }

  const isEmpty = d.length === 0 || chartData.every(item => item.count === 0);

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">توزیع پزشکان در گروه های رفتاری</h3>
      <p className="chart-subtitle">(یک پزشک می‌تواند در چند گروه باشد)</p>
      <div className="chart-wrapper" dir="ltr">
        {isEmpty ? (
          <div style={EMPTY_STATE_STYLE}>داده‌ای برای نمایش وجود ندارد</div>
        ) : (
          <ResponsiveBar
            data={chartData}
            keys={['count']}
            indexBy="flag"
            margin={{ top: 20, right: 40, bottom: 40, left: 120 }}
            tooltip={({ data }) => (
              <ChartTooltip
                title={data.flag}
                rows={[{ label: 'تعداد پزشکان', value: data.count }]}
              />
            )}
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
        )}
      </div>
    </div>
  );
};

export default FlagMembershipChart;