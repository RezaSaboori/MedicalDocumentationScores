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
    <section className="glass u-container u-container--lg upload-modal-section">
      <div className="upload-modal-section-title">{title} ({rows.length} رکورد)</div>
      <div className="upload-modal-table-wrapper custom-scrollbar">
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
                      <input className="upload-modal-input" type="text" value={buffer.name || ''} onChange={(e) => setBuffer(b => ({ ...b, name: e.target.value }))} />
                    </td>
                    <td>
                      <select className="upload-modal-input" value={buffer.category || 'resident'} onChange={(e) => setBuffer(b => ({ ...b, category: e.target.value }))}>
                        <option value="resident">دستیار</option>
                        <option value="faculty">هیئت علمی</option>
                      </select>
                    </td>
                    <td>
                      <input className="upload-modal-input" type="text" value={buffer.year ?? ''} onChange={(e) => setBuffer(b => ({ ...b, year: e.target.value }))} />
                    </td>
                    <td>{row.V}</td>
                    <td>{Number(row.PDI).toFixed(2)}</td>
                    <td>{row.flags}</td>
                    <td>
                      <button className="upload-modal-btn upload-modal-btn--sm green-glass upload-modal-btn--solid" onClick={saveEdit}>ذخیره</button>{' '}
                      <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost" onClick={cancelEdit}>انصراف</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{row.name}</td>
                    <td>
                      <span className={`upload-modal-badge ${row.category === 'faculty' ? 'upload-modal-badge--faculty' : 'upload-modal-badge--resident'}`}>
                        {CATEGORY_FA[row.category] || row.category}
                      </span>
                    </td>
                    <td>{row.year ?? '—'}</td>
                    <td>{row.V}</td>
                    <td>{Number(row.PDI).toFixed(2)}</td>
                    <td>{row.flags}</td>
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
    </section>
  );
};

export default PreviewTable;