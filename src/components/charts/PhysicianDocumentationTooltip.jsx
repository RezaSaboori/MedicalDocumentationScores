import React from 'react';
import ChartTooltip from './ChartTooltip';
import './PhysicianTrendTooltip.css';
import './PhysicianDocumentationTooltip.css';

const PhysicianDocumentationTooltip = ({
  title,
  group,
  groupColor,
  columns = [],
  rows = [],
}) => (
  <ChartTooltip
    title={title}
    className="physician-trend-tooltip physician-documentation-tooltip"
  >
    <div className="physician-documentation-tooltip__group">
      <span
        className="physician-trend-tooltip__swatch"
        style={{
          backgroundColor:
            groupColor ||
            'var(--color-gray6)',
        }}
      />

      <span className="physician-documentation-tooltip__group-label">
        گروه
      </span>

      <strong className="physician-documentation-tooltip__group-value">
        {group || '—'}
      </strong>
    </div>

    <div className="physician-trend-tooltip__section">
      <table className="physician-trend-tooltip__table physician-trend-tooltip__table--comparison">
        <thead>
          <tr>
            {columns.map(
              (column) => (
                <th key={column}>
                  {column}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row) => (
              <tr key={row.label}>
                <td>
                  {row.label}
                </td>

                {row.values.map(
                  (
                    value,
                    index
                  ) => (
                    <td
                      key={`${row.label}-${index}`}
                      className="physician-trend-tooltip__value"
                    >
                      {value}
                    </td>
                  )
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  </ChartTooltip>
);

export default PhysicianDocumentationTooltip;