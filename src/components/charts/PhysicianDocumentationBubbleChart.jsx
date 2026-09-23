import React from 'react';
import {
  useTooltip,
} from '@nivo/tooltip';
import {
  formatNumber,
  formatPercent,
} from '../../utils/formatters';
import {
  formatPeriodLabel,
  toPersianDigits,
} from '../../utils/period';
import PhysicianDocumentationTooltip from './PhysicianDocumentationTooltip';

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

  const formatVisitValue = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    const number =
      Number(value);

    return Number.isFinite(number)
      ? formatNumber(
          number,
          1
        )
      : '—';
  };

  const formatRatioValue = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    const number =
      Number(value);

    return Number.isFinite(number)
      ? formatPercent(
          number,
          1
        )
      : '—';
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

    const isResident =
      row.category ===
      'resident';

    const hasKnownYear =
      row.resident_year !==
        null &&
      row.resident_year !==
        undefined &&
      String(
        row.resident_year
      ).trim() !== '';

    const showYearComparison =
      isResident &&
      hasKnownYear;

    const columns =
      showYearComparison
        ? [
            'شاخص',
            'پزشک',
            `دستیاران سال ${toPersianDigits(
              row.resident_year
            )}`,
            'همه دستیاران',
          ]
        : [
            'شاخص',
            'پزشک',
            'همه دستیاران',
          ];

    const rows = [
      {
        label: 'ویزیت',

        values:
          showYearComparison
            ? [
                formatVisitValue(
                  row.V
                ),

                formatVisitValue(
                  row.year_residents_V
                ),

                formatVisitValue(
                  row.residents_V
                ),
              ]
            : [
                formatVisitValue(
                  row.V
                ),

                formatVisitValue(
                  row.residents_V
                ),
              ],
      },

      {
        label:
          'نسبت مستندسازی',

        values:
          showYearComparison
            ? [
                formatRatioValue(
                  row.documentation_ratio
                ),

                formatRatioValue(
                  row.year_residents_documentation_ratio
                ),

                formatRatioValue(
                  row.residents_documentation_ratio
                ),
              ]
            : [
                formatRatioValue(
                  row.documentation_ratio
                ),

                formatRatioValue(
                  row.residents_documentation_ratio
                ),
              ],
      },
    ];

    showTooltip(
      <PhysicianDocumentationTooltip
        title={
          formatPeriodLabel(
            row.period
          )
        }
        group={
          row.group_fa
        }
        groupColor={
          row.group_color
        }
        columns={
          columns
        }
        rows={
          rows
        }
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