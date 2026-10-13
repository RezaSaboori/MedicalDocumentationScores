import React, { useState } from 'react';
import VisibilityButton from './VisibilityButton';
import { isPersonnelVisible } from '../../../shared/personnel.js';

const ResidentsManager = ({
  rows,
  kind = 'resident',
  onRowsChange,
  onSave,
  onClear,
  saving,
  saved,
  dropProps,
  dragActive,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [buffer, setBuffer] = useState({});

  const hasRows = rows.length > 0;
  const isFaculty = kind === 'faculty';
  const label = isFaculty ? 'هیئت علمی' : 'رزیدنت‌ها';

  const startEdit = (idx) => { setEditingIndex(idx); setBuffer({ ...rows[idx] }); };
  const cancelEdit = () => { setEditingIndex(null); setBuffer({}); };
  const saveEdit = () => {
    onRowsChange(rows.map((r, i) => (i === editingIndex ? { ...r, ...buffer } : r)));
    cancelEdit();
  };
  const addRow = () => {
    const newRow = isFaculty
      ? { name: '', visible: 1 }
      : { name: '', year: null, visible: 1 };

    onRowsChange([...rows, newRow]);
    setEditingIndex(rows.length);
    setBuffer(newRow);
  };

  return (
    <>
      <div className="upload-modal-table-wrapper custom-scrollbar">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>نام</th>
              {!isFaculty && <th>سال دستیاری</th>}
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
                      <input
                        className="upload-modal-input"
                        type="text"
                        value={buffer.name || ''}
                        onChange={(e) => setBuffer(b => ({ ...b, name: e.target.value }))}
                      />
                    </td>
                    {!isFaculty && (
                      <td>
                        <input
                          className="upload-modal-input"
                          type="text"
                          value={buffer.year ?? ''}
                          onChange={(e) =>
                            setBuffer(b => ({ ...b, year: e.target.value }))
                          }
                        />
                      </td>
                    )}
                    <td>
                      <button className="upload-modal-btn upload-modal-btn--sm green-glass upload-modal-btn--solid" onClick={saveEdit}>ذخیره</button>{' '}
                      <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost" onClick={cancelEdit}>انصراف</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <span
                        className={
                          isPersonnelVisible(row)
                            ? ''
                            : 'upload-modal-person--hidden'
                        }
                      >
                        {row.name}
                      </span>
                    </td>

                    {!isFaculty && (
                      <td>{row.year ?? 'نامشخص'}</td>
                    )}

                    <td>
                      <VisibilityButton
                        visible={isPersonnelVisible(row)}
                        name={row.name}
                        onClick={() => {
                          onRowsChange(
                            rows.map((person, index) =>
                              index === idx
                                ? {
                                    ...person,
                                    visible: isPersonnelVisible(person) ? 0 : 1,
                                  }
                                : person
                            )
                          );
                        }}
                      />

                      <button
                        className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost"
                        onClick={() => startEdit(idx)}
                      >
                        ویرایش
                      </button>

                      <button
                        className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--danger"
                        onClick={() =>
                          onRowsChange(rows.filter((_, i) => i !== idx))
                        }
                      >
                        حذف
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            <tr>
              <td colSpan={isFaculty ? 3 : 4} className="upload-modal-add-row-cell">
                <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost" onClick={addRow}>
                  + افزودن ردیف جدید
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="upload-modal-section-footer">
        {saved && (
          <span className="upload-modal-saved">
            مشخصات {label} ذخیره شد.
          </span>
        )}

        {!hasRows ? (
          <div
            className={`upload-modal-dropzone upload-modal-dropzone--compact ${
              dragActive ? 'upload-modal-dropzone--active' : ''
            }`}
            {...dropProps}
          >
            <div>انتخاب یا رها کردن فایل CSV مشخصات {label}</div>
            <div className="upload-modal-dropzone__hint">
              فرمت مجاز: csv — یا افزودن دستی از دکمه بالا
            </div>
          </div>
        ) : (
          <>
            <button
              className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost"
              onClick={dropProps.onClick}
              disabled={saving}
            >
              جایگزینی CSV
            </button>

            <button
              className="upload-modal-btn upload-modal-btn--danger"
              onClick={() => {
                cancelEdit();
                onClear();
              }}
              disabled={saving}
            >
              حذف
            </button>

            <button
              className="upload-modal-btn blue-glass upload-modal-btn--solid"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ResidentsManager;