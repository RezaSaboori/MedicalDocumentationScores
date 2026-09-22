import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatPercent } from '../../utils/formatters';
import { PDI_THRESHOLD } from '../../utils/constants';
import { Skeleton } from '../ui/Skeleton';
import './AuditTable.css';

const AuditTable = () => {
  const { data, loading } = useDashboard();
  const [sortConfig, setSortConfig] = useState({ key: 'PDI', direction: 'desc' });

  const sortedData = useMemo(() => {
    if (!data.current) return [];

    return [...data.current].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'desc'
          ? 'asc'
          : 'desc',
    }));
  };

  return (
    <section className="glass u-container u-container--md audit-panel">
      <div className="audit-panel__body">
        <table className="audit-table">
          <colgroup>
            <col className="audit-table__col audit-table__col--index" />
            <col className="audit-table__col audit-table__col--name" />
            <col className="audit-table__col audit-table__col--group" />
            <col className="audit-table__col audit-table__col--visits" />
            <col className="audit-table__col audit-table__col--empty-rate" />
            <col className="audit-table__col audit-table__col--pdi" />
            <col className="audit-table__col audit-table__col--status" />
            <col className="audit-table__col audit-table__col--calibrated-score" />
            <col className="audit-table__col audit-table__col--raw-score" />
            <col className="audit-table__col audit-table__col--adjusted-quality" />
            <col className="audit-table__col audit-table__col--laq" />
          </colgroup>

          <thead>
            <tr>
              <th className="audit-table__index audit-table__static-header">
                ردیف
              </th>

              <th onClick={() => handleSort('name')}>
                نام
              </th>

              <th onClick={() => handleSort('group_fa')}>
                گروه
              </th>

              <th onClick={() => handleSort('V')}>
                ویزیت
              </th>

              <th onClick={() => handleSort('rho_Z')}>
                نرخ خالی
              </th>

              <th onClick={() => handleSort('PDI')}>
                امتیاز کیفیت ثبت پرونده‌ها
              </th>

              <th className="audit-table__static-header">
                وضعیت
              </th>

              <th onClick={() => handleSort('calibrated_score')}>
                میانگین نمرات پرونده‌ها - کالیبره‌شده
              </th>

              <th onClick={() => handleSort('raw_score')}>
                میانگین نمرات پرونده‌ها - خام
              </th>

              <th onClick={() => handleSort('WQS_adj')}>
                کیفیت تعدیل‌شده
              </th>

              <th onClick={() => handleSort('LAQ')}>
                LAQ
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && Array.from({ length: 10 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {Array.from({ length: 11 }).map((_, j) => (
                  <td
                    key={j}
                    className={j === 0 ? 'audit-table__index' : undefined}
                  >
                    <Skeleton width="80%" height="0.9rem" />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && sortedData.map((row, i) => {
              const isPdiAcceptable =
                Number(row.PDI) >= PDI_THRESHOLD;

              return (
                <tr key={i}>
                  <td className="audit-table__index">
                    {i + 1}
                  </td>

                  <td className="audit-table__name">
                    {row.name}
                  </td>

                  <td>
                    <span
                      className="audit-table__group"
                      style={{
                        '--audit-group-color':
                          row.group_color || 'var(--color-gray7)',
                      }}
                    >
                      {row.group_fa}
                    </span>
                  </td>

                  <td>{row.V}</td>

                  <td>
                    {formatPercent(row.rho_Z)}
                  </td>

                  <td>
                    {row.PDI?.toFixed(1)}
                  </td>

                  <td className="audit-table__status-cell">
                    <span
                      className="audit-table__status"
                      style={{
                        '--audit-status-color':
                          isPdiAcceptable
                            ? 'var(--color-green)'
                            : 'var(--color-red)',
                      }}
                    >
                      <span
                        className="audit-table__status-dot"
                        aria-hidden="true"
                      />

                      <span>
                        {isPdiAcceptable
                          ? 'مطلوب'
                          : 'نیازمند بهبود'}
                      </span>
                    </span>
                  </td>

                  <td>
                    {row.calibrated_score?.toFixed(2)}
                  </td>

                  <td>
                    {row.raw_score?.toFixed(2)}
                  </td>

                  <td>
                    {row.WQS_adj?.toFixed(2)}
                  </td>

                  <td>
                    {row.LAQ?.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AuditTable;