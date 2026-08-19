import React, { useState } from 'react';

const ResidentsTable = ({ rows, onRowChange, onRowRemove }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [buffer, setBuffer] = useState({});

  if (!rows.length) return null;

  const startEdit = (idx) => { setEditingIndex(idx); setBuffer({ ...rows[idx] }); };
  const cancelEdit = () => { setEditingIndex(null); setBuffer({}); };
  const saveEdit = () => { onRowChange(editingIndex, buffer); cancelEdit(); };

  return (
    <div className="upload-modal-table-wrapper custom-scrollbar">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>نام</th>
            <th>سال دستیاری</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.name}-${idx}`}>
              <td>{idx + 1}</td>
              {editingIndex === idx ? (
                <>
                  <td>
                    <input className="upload-modal-input" type="text" value={buffer.name || ''} onChange={(e) => setBuffer(b => ({ ...b, name: e.target.value }))} />
                  </td>
                  <td>
                    <input className="upload-modal-input" type="text" value={buffer.year ?? ''} onChange={(e) => setBuffer(b => ({ ...b, year: e.target.value }))} />
                  </td>
                  <td>
                    <button className="upload-modal-btn upload-modal-btn--sm green-glass upload-modal-btn--solid" onClick={saveEdit}>ذخیره</button>{' '}
                    <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost" onClick={cancelEdit}>انصراف</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{row.name}</td>
                  <td>{row.year ?? '—'}</td>
                  <td>
                    <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost" onClick={() => startEdit(idx)}>ویرایش</button>{' '}
                    <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--danger" onClick={() => onRowRemove(idx)}>حذف</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResidentsTable;