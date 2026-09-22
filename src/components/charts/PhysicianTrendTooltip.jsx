import React from 'react';
import ChartTooltip from './ChartTooltip';
import './PhysicianTrendTooltip.css';

const PhysicianTrendTooltip = ({
  title,
  columns = [],
  rows = [],
}) => (
  <ChartTooltip
    title={title}
    className="physician-trend-tooltip"
  >
    <div className="physician-trend-tooltip__section">
      <table className="physician-trend-tooltip__table">
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
                  <span className="physician-trend-tooltip__metric">
                    {row.color && (
                      <span
                        className="physician-trend-tooltip__swatch"
                        style={{
                          backgroundColor:
                            row.color,
                        }}
                      />
                    )}

                    <span>
                      {row.label}
                    </span>
                  </span>
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

export default PhysicianTrendTooltip;