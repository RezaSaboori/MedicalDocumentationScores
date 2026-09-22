import React from 'react';
import {
  useTooltip,
} from '@nivo/tooltip';
import {
  formatPercent,
} from '../../utils/formatters';
import {
  formatPeriodLabel,
} from '../../utils/period';
import PhysicianTrendTooltip from './PhysicianTrendTooltip';

const PhysicianDocumentationBubbleLayer = ({
  nodes,
  maxVisits,
}) => {
  const tooltip =
    useTooltip();

  const showTooltip = (
    content,
    event
  ) => {
    if (
      typeof tooltip
        .showTooltipFromEvent ===
      'function'
    ) {
      tooltip.showTooltipFromEvent(
        content,
        event
      );

      return;
    }

    if (
      typeof tooltip
        .showTooltip ===
      'function'
    ) {
      tooltip.showTooltip(
        content,
        event
      );
    }
  };

  const hideTooltip = () => {
    if (
      typeof tooltip
        .hideTooltip ===
      'function'
    ) {
      tooltip.hideTooltip();
    }
  };

  const handleTooltip = (
    event,
    node
  ) => {
    const row =
      node.data?.row;

    if (!row) {
      return;
    }

    showTooltip(
      <PhysicianTrendTooltip
        title={
          formatPeriodLabel(
            row.period
          )
        }
        columns={[
          'شاخص',
          'مقدار',
        ]}
        rows={[
          {
            label: 'گروه',
            color:
              row.group_color,
            values: [
              row.group_fa ||
                '—',
            ],
          },
          {
            label: 'ویزیت',
            values: [
              Number(
                row.V
              ).toLocaleString(
                'en-US'
              ),
            ],
          },
          {
            label:
              'نسبت مستندسازی',
            values: [
              formatPercent(
                row.documentation_ratio,
                1
              ),
            ],
          },
        ]}
        qualityRow={row}
      />,
      event
    );
  };

  return (
    <g>
      {nodes.map(
        (node) => {
          const visits =
            Math.max(
              0,
              Number(
                node.data?.row
                  ?.V
              ) || 0
            );

          const ratio =
            maxVisits > 0
              ? visits /
                maxVisits
              : 0;

          const radius =
            4 +
            12 *
              Math.sqrt(
                ratio
              );

          return (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={radius}
              fill={node.color}
              fillOpacity="0.72"
              stroke={node.color}
              strokeWidth="1.5"
              className="physician-documentation-bubble__node"
              onMouseEnter={(
                event
              ) =>
                handleTooltip(
                  event,
                  node
                )
              }
              onMouseMove={(
                event
              ) =>
                handleTooltip(
                  event,
                  node
                )
              }
              onMouseLeave={
                hideTooltip
              }
            />
          );
        }
      )}
    </g>
  );
};

export default PhysicianDocumentationBubbleLayer;