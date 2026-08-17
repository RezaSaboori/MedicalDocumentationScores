import React from 'react';

// nivo computed nodes expose pixel coords (x, y) and color on every version.
// The raw datum may live on node.data (newer builds) or be spread onto the
// node itself (older builds), so fields are read defensively from both.
const readField = (node, key) => {
  const sources = [node && node.data, node];
  for (const src of sources) {
    if (src && typeof src === 'object' && src[key] !== undefined && src[key] !== null && src[key] !== '') {
      return src[key];
    }
  }
  return undefined;
};

const BubbleNodesLayer = ({ nodes, sizeKey, maxValue, minR = 4, maxR = 17.5 }) => (
  <g>
    {nodes.map((node) => {
      const value = Number(readField(node, sizeKey)) || 0;
      const ratio = maxValue > 0 ? value / maxValue : 0;
      const r = minR + (maxR - minR) * Math.sqrt(ratio);
      const name = readField(node, 'name') ?? '';
      const group = readField(node, 'group_fa') ?? '';
      const v = Number(readField(node, 'V')) || 0;
      const n = Number(readField(node, 'N')) || 0;
      const pdi = readField(node, 'PDI');
      return (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r={r}
          fill={node.color}
          fillOpacity={0.72}
          stroke={node.color}
          strokeWidth={1}
        >
          <title>{`${name} | ${group} | ویزیت: ${v} | پرونده طبقه‌بندی‌شده: ${n}${pdi !== undefined ? ` | PDI: ${Number(pdi).toFixed(1)}` : ''}`}</title>
        </circle>
      );
    })}
  </g>
);

export default BubbleNodesLayer;