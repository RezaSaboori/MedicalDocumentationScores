import React from 'react';
import {
  ResponsiveScatterPlot,
} from '@nivo/scatterplot';

const PhysicianTrendYAxis = ({
  data,
  xScale,
  yScale,
  axisLeft,
}) => (
  <div className="physician-trend-chart__y-axis">
    <ResponsiveScatterPlot
      data={data}
      margin={{
        top: 24,
        right: 8,
        bottom: 76,
        left: 72,
      }}
      xScale={xScale}
      yScale={yScale}
      axisTop={null}
      axisRight={null}
      axisBottom={null}
      axisLeft={
        axisLeft
      }
      enableGridX={false}
      enableGridY={false}
      isInteractive={false}
      layers={[
        'axes',
      ]}
    />
  </div>
);

export default PhysicianTrendYAxis;