import React from 'react';
import {
  useTooltip,
} from '@nivo/tooltip';
import ChartTooltip from './ChartTooltip';
import {
  formatPercent,
} from '../../utils/formatters';
import {
  formatPeriodLabel,
} from '../../utils/period';

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
      <ChartTooltip
        title={
          formatPeriodLabel(
            row.period
          )
        }
        rows={[
          {
            label: 'گروه',
            value:
              row.group_fa ||
              '—',
          },
          {
            label: 'ویزیت',
            value:
              Number(
                row.V
              ).toLocaleString(
                'en-US'
              ),
          },
          {
            label:
              'نسبت مستندسازی',
            value:
              formatPercent(
                row.documentation_ratio,
                1
              ),
          },
        ]}
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