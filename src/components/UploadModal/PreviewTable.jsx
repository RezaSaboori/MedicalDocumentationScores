import React, { useState } from 'react';

const CATEGORY_FA = { faculty: 'هیئت علمی', resident: 'دستیار' };

const PreviewTable = ({ title, rows, onRowChange, onRowRemove }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [buffer, setBuffer] = useState({});

  if (!rows.length) return null;

  const startEdit = (idx) => { setEditingIndex(idx); setBuffer({ ...rows[idx] }); };
  const cancelEdit = () => { setEditingIndex(null); setBuffer({}); };
  const saveEdit = () => { onRowChange(editingIndex, buffer); cancelEdit(); };

  return (
    <div>
      <div className="preview-table__title">{title} ({rows.length} رکورد)</div>
      <div className="data-table-wrapper" style={{ maxHeight: '22rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>دسته</th>
              <th>سال</th>
              <th>ویزیت (V)</th>
              <th>PDI</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.name}-${idx}`}>
                {editingIndex === idx ? (
                  <>
                    <td>
                      <input type="text" value={buffer.name || ''} onChange={(e) => setBuffer(b => ({ ...b, name: e.target.value }))} />
                    </td>
                    <td>
                      <select value={buffer.category || 'resident'} onChange={(e) => setBuffer(b => ({ ...b, category: e.target.value }))}>
                        <option value="resident">دستیار</option>
                        <option value="faculty">هیئت علمی</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={buffer.year ?? ''} onChange={(e) => setBuffer(b => ({ ...b, year: e.target.value }))} />
                    </td>
                    <td>{row.V}</td>
                    <td>{Number(row.PDI).toFixed(2)}</td>
                    <td>{row.flags}</td>
                    <td>
                      <button className="btn-sm btn-sm--success" onClick={saveEdit}>ذخیره</button>{' '}
                      <button className="btn-sm btn-sm--ghost" onClick={cancelEdit}>انصراف</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{row.name}</td>
                    <td>
                      <span className={`badge ${row.category === 'faculty' ? 'badge--faculty' : 'badge--resident'}`}>
                        {CATEGORY_FA[row.category] || row.category}
                      </span>
                    </td>
                    <td>{row.year ?? '—'}</td>
                    <td>{row.V}</td>
                    <td>{Number(row.PDI).toFixed(2)}</td>
                    <td>{row.flags}</td>
                    <td>
                      <button className="btn-sm btn-sm--ghost" onClick={() => startEdit(idx)}>ویرایش</button>{' '}
                      <button className="btn-sm btn-sm--danger" onClick={() => onRowRemove(idx)}>حذف</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreviewTable;