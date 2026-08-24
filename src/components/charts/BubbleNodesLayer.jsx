import React from 'react';
import { useTooltip } from '@nivo/tooltip';
import ChartTooltip from './ChartTooltip';

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

const BubbleNodesLayer = ({ nodes, sizeKey, maxValue, minR = 4, maxR = 17.5 }) => {
  const tooltip = useTooltip();

  // Supports both nivo tooltip APIs (old: showTooltip, new: showTooltipFromEvent).
  const show = (content, event) => {
    if (typeof tooltip.showTooltipFromEvent === 'function') tooltip.showTooltipFromEvent(content, event);
    else if (typeof tooltip.showTooltip === 'function') tooltip.showTooltip(content, event);
  };

  const hide = () => {
    if (typeof tooltip.hideTooltip === 'function') tooltip.hideTooltip();
  };

  const handleMove = (event, node) => {
    const name = readField(node, 'name') ?? '';
    const group = readField(node, 'group_fa') ?? '';
    const v = Number(readField(node, 'V')) || 0;
    const n = Number(readField(node, 'N')) || 0;
    const pdi = readField(node, 'PDI');
    const laq = readField(node, 'LAQ');
    show(
      <ChartTooltip
        title={name}
        rows={[
          { label: 'گروه', value: group },
          { label: 'ویزیت', value: v.toLocaleString('en-US') },
          { label: 'پرونده طبقه‌بندی‌شده', value: n.toLocaleString('en-US') },
          ...(pdi !== undefined ? [{ label: 'PDI', value: Number(pdi).toFixed(1) }] : []),
          ...(laq !== undefined ? [{ label: 'LAQ', value: Number(laq).toFixed(2) }] : []),
        ]}
      />,
      event
    );
  };

  return (
    <g>
      {nodes.map((node) => {
        const value = Number(readField(node, sizeKey)) || 0;
        const ratio = maxValue > 0 ? value / maxValue : 0;
        const r = minR + (maxR - minR) * Math.sqrt(ratio);
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
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => handleMove(e, node)}
            onMouseMove={(e) => handleMove(e, node)}
            onMouseLeave={hide}
          />
        );
      })}
    </g>
  );
};

export default BubbleNodesLayer;