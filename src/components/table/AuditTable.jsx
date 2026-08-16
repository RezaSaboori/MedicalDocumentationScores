import React from 'react';

const AuditTable = () => {
  return (
    <div style={{ overflowX: 'auto', color: 'var(--color-gray8)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-gray3)', color: 'var(--color-gray12)' }}>
            <th style={{ padding: 'var(--spacing-sm)' }}>نام</th>
            <th style={{ padding: 'var(--spacing-sm)' }}>گروه</th>
            <th style={{ padding: 'var(--spacing-sm)' }}>ویزیت</th>
            <th style={{ padding: 'var(--spacing-sm)' }}>PDI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="4" style={{ padding: 'var(--spacing-lg)' }}>Table Data Placeholder</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;