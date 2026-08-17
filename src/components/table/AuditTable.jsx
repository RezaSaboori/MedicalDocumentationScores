import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatPercent } from '../../utils/formatters';
import { Skeleton } from '../ui/Skeleton';
import './AuditTable.css';

const AuditTable = () => {
  const { data, loading } = useDashboard();
  const [sortConfig, setSortConfig] = useState({ key: 'PDI', direction: 'desc' });

  const sortedData = useMemo(() => {
    if (!data.current) return [];
    return [...data.current].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  return (
    <div className="table-wrapper">
      <table className="audit-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>نام</th>
            <th onClick={() => handleSort('group_fa')}>گروه</th>
            <th onClick={() => handleSort('V')}>ویزیت</th>
            <th onClick={() => handleSort('rho_F')}>نرخ داده کاذب</th>
            <th onClick={() => handleSort('rho_Z')}>نرخ خالی</th>
            <th onClick={() => handleSort('WQS_adj')}>کیفیت تعدیل‌شده</th>
            <th onClick={() => handleSort('LAQ')}>LAQ</th>
            <th onClick={() => handleSort('PDI')}>PDI</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 10 }).map((_, i) => (
            <tr key={`skeleton-${i}`}>
              {Array.from({ length: 8 }).map((_, j) => (
                <td key={j}><Skeleton width="80%" height="0.9rem" /></td>
              ))}
            </tr>
          ))}
          {!loading && sortedData.slice(0, 50).map((row, i) => (
            <tr key={i}>
              <td>{row.name}</td>
              <td>{row.group_fa}</td>
              <td>{row.V}</td>
              <td>{formatPercent(row.rho_F)}</td>
              <td>{formatPercent(row.rho_Z)}</td>
              <td>{row.WQS_adj?.toFixed(2)}</td>
              <td>{row.LAQ?.toFixed(2)}</td>
              <td>{row.PDI?.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;