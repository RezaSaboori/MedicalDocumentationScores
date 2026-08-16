import React from 'react';
import './AuditTable.css';

const AuditTable = () => {
  return (
    <div className="table-wrapper">
      <table className="audit-table">
        <thead>
          <tr>
            <th>نام</th>
            <th>گروه</th>
            <th>ویزیت</th>
            <th>PDI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="4">Table Data Placeholder</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;