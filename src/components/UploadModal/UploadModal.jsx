import React, { useState, useCallback, useEffect, useRef } from 'react';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import {
  saveUploadedDataset,
  saveResidentsList,
  getResidentsList,
  clearResidentsList,
} from '../../services/dataService';
import './UploadModal.css';

export const UploadModal = ({ isOpen, onClose, onDataProcessed }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);

  const [residentsData, setResidentsData] = useState([]);
  const [residentsFileName, setResidentsFileName] = useState(null);

  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingResidents, setIsDraggingResidents] = useState(false);

  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editBuffer, setEditBuffer] = useState({});

  const mainInputRef = useRef(null);
  const residentsInputRef = useRef(null);

  // Load persisted residents list when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getResidentsList();
      setResidentsData(stored.list || []);
      setResidentsFileName(stored.fileName || null);
      setError(null);
    }
  }, [isOpen]);

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    setEditingRowIndex(null);
    setEditBuffer({});
    if (mainInputRef.current) mainInputRef.current.value = '';
  };

  // ----- Main XLSX handlers -----
  const handleMainFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!/\.(xlsx|xls)$/i.test(selectedFile.name)) {
      setError('لطفاً فایل با فرمت XLSX انتخاب کنید.');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const onMainDrop = (e) => {
    e.preventDefault();
    setIsDraggingMain(false);
    handleMainFile(e.dataTransfer.files[0]);
  };

  // ----- Residents CSV handlers -----
  const handleResidentsFile = async (selectedFile) => {
    if (!selectedFile) return;
    if (!/\.csv$/i.test(selectedFile.name)) {
      setError('فایل لیست دستیاران باید با فرمت CSV باشد.');
      return;
    }
    try {
      const parsed = await parseResidentsCSV(selectedFile);
      setResidentsData(parsed);
      setResidentsFileName(selectedFile.name);
      saveResidentsList(parsed, selectedFile.name);
      setError(null);
    } catch (err) {
      setError('خطا در خواندن فایل CSV دستیاران.');
    }
  };

  const onResidentsDrop = (e) => {
    e.preventDefault();
    setIsDraggingResidents(false);
    handleResidentsFile(e.dataTransfer.files[0]);
  };

  const removeResidents = () => {
    clearResidentsList();
    setResidentsData([]);
    setResidentsFileName(null);
    if (residentsInputRef.current) residentsInputRef.current.value = '';
  };

  // ----- Residents inline edit -----
  const updateResidentRow = (index, field, value) => {
    setResidentsData(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeResidentRow = (index) => {
    setResidentsData(prev => {
      const next = prev.filter((_, i) => i !== index);
      saveResidentsList(next, residentsFileName);
      return next;
    });
  };

  const persistResidentsEdits = () => {
    saveResidentsList(residentsData, residentsFileName);
  };

  // ----- Process main file -----
  const processFiles = useCallback(async () => {
    if (!file) {
      setError('لطفاً فایل اصلی گزارش عملکرد را انتخاب یا در ناحیه مربوطه رها کنید.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const processed = await parseAndProcessExcel(file, residentsData);
      setPreviewData(processed); // show ALL rows
    } catch (err) {
      console.error('Pipeline Error:', err);
      setError(err.message || 'خطا در پردازش فایل. لطفاً کنسول مرورگر را بررسی کنید.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, residentsData]);

  // ----- Preview row edit/remove -----
  const startEditRow = (index) => {
    setEditingRowIndex(index);
    setEditBuffer({ ...previewData[index] });
  };

  const cancelEditRow = () => {
    setEditingRowIndex(null);
    setEditBuffer({});
  };

  const saveEditRow = () => {
    setPreviewData(prev => {
      const next = [...prev];
      next[editingRowIndex] = { ...next[editingRowIndex], ...editBuffer };
      return next;
    });
    setEditingRowIndex(null);
    setEditBuffer({});
  };

  const removePreviewRow = (index) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
  };

  const updateEditBuffer = (field, value) => {
    setEditBuffer(prev => ({ ...prev, [field]: value }));
  };

  // ----- Save dataset -----
  const handleSave = async () => {
    if (!previewData.length) return;
    try {
      await saveUploadedDataset(previewData);
      onDataProcessed(previewData);
      onClose();
      resetState();
    } catch (err) {
      setError('خطا در ذخیره‌سازی داده‌ها.');
    }
  };

  if (!isOpen) return null;

  const hasResidents = residentsData.length > 0;

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div
        className="glass-transparent upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="upload-modal__header">
          <h2 className="upload-modal__title">بارگذاری و پردازش داده‌های پرونده الکترونیک</h2>
          <button className="upload-modal__close" onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className="upload-modal__body">
          {/* Residents warning if missing */}
          {!hasResidents && (
            <div className="residents-warning">
              ⚠️ فایل لیست دستیاران هنوز بارگذاری نشده است. برای تفکیک دقیق «هیئت علمی» و «دستیاران» و تعیین سال دستیاری، آن را انتخاب یا در ناحیه زیر رها کنید.
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {/* Main XLSX dropzone */}
          <div>
            <label className="dropzone-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              فایل گزارش عملکرد (XLSX)
            </label>
            <div
              className={`dropzone ${isDraggingMain ? 'dropzone--active' : ''}`}
              onClick={() => mainInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
              onDragLeave={() => setIsDraggingMain(false)}
              onDrop={onMainDrop}
            >
              <div>فایل را اینجا رها کنید یا برای انتخاب کلیک کنید</div>
              <div className="dropzone__hint">فرمت‌های مجاز: XLSX, XLS</div>
              {file && <div className="dropzone__filename">📄 {file.name}</div>}
            </div>
            <input
              ref={mainInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleMainFile(e.target.files[0])}
            />
          </div>

          {/* Residents section */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              فایل لیست دستیاران (CSV) — اختیاری، یک‌بار بارگذاری
            </label>

            {!hasResidents ? (
              <div
                className={`dropzone ${isDraggingResidents ? 'dropzone--active' : ''}`}
                onClick={() => residentsInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingResidents(true); }}
                onDragLeave={() => setIsDraggingResidents(false)}
                onDrop={onResidentsDrop}
              >
                <div>فایل CSV دستیاران را اینجا رها کنید یا کلیک کنید</div>
                <div className="dropzone__hint">باید شامل ستون‌های «نام»، «نام خانوادگی» و «سال دستیاری» باشد</div>
              </div>
            ) : (
              <div className="residents-card">
                <div className="residents-card__header">
                  <div className="residents-card__title">
                    ✅ لیست دستیاران بارگذاری شده {residentsFileName ? `(${residentsFileName})` : ''} — {residentsData.length} رکورد
                  </div>
                  <div className="residents-card__actions">
                    <button className="btn-sm btn-sm--ghost" onClick={() => residentsInputRef.current?.click()}>
                      بارگذاری مجدد / ویرایش فایل
                    </button>
                    <button className="btn-sm btn-sm--danger" onClick={removeResidents}>
                      حذف لیست
                    </button>
                  </div>
                </div>

                <div className="data-table-wrapper">
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
                      {residentsData.map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateResidentRow(idx, 'name', e.target.value)}
                              onBlur={persistResidentsEdits}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.year}
                              onChange={(e) => updateResidentRow(idx, 'year', e.target.value)}
                              onBlur={persistResidentsEdits}
                            />
                          </td>
                          <td>
                            <button className="btn-sm btn-sm--danger" onClick={() => removeResidentRow(idx)}>
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <input
              ref={residentsInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => handleResidentsFile(e.target.files[0])}
            />
          </div>

          {/* Process button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-sm btn-sm--primary"
              style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}
              onClick={processFiles}
              disabled={isProcessing || !file}
            >
              {isProcessing ? 'در حال پردازش...' : 'پردازش و پیش‌نمایش'}
            </button>
          </div>

          {/* Full preview table with edit/remove */}
          {previewData.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                پیش‌نمایش کامل داده‌های پردازش‌شده ({previewData.length} رکورد)
              </div>
              <div className="data-table-wrapper" style={{ maxHeight: '24rem' }}>
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
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {editingRowIndex === idx ? (
                          <>
                            <td>
                              <input
                                type="text"
                                value={editBuffer.name || ''}
                                onChange={(e) => updateEditBuffer('name', e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                value={editBuffer.category || 'resident'}
                                onChange={(e) => updateEditBuffer('category', e.target.value)}
                              >
                                <option value="resident">دستیار</option>
                                <option value="faculty">هیئت علمی</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editBuffer.year ?? ''}
                                onChange={(e) => updateEditBuffer('year', e.target.value)}
                              />
                            </td>
                            <td>{row.V}</td>
                            <td>{row.PDI.toFixed(2)}</td>
                            <td>{row.flags}</td>
                            <td>
                              <button className="btn-sm btn-sm--success" onClick={saveEditRow}>ذخیره</button>{' '}
                              <button className="btn-sm btn-sm--ghost" onClick={cancelEditRow}>انصراف</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{row.name}</td>
                            <td>
                              <span className={`badge ${row.category === 'faculty' ? 'badge--faculty' : 'badge--resident'}`}>
                                {row.category === 'faculty' ? 'هیئت علمی' : 'دستیار'}
                              </span>
                            </td>
                            <td>{row.year ?? '—'}</td>
                            <td>{row.V}</td>
                            <td>{row.PDI.toFixed(2)}</td>
                            <td>{row.flags}</td>
                            <td>
                              <button className="btn-sm btn-sm--ghost" onClick={() => startEditRow(idx)}>ویرایش</button>{' '}
                              <button className="btn-sm btn-sm--danger" onClick={() => removePreviewRow(idx)}>حذف</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="upload-modal__footer">
          <button className="btn-sm btn-sm--ghost" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            انصراف
          </button>
          <button
            className="btn-sm btn-sm--success"
            style={{ padding: '0.5rem 1.25rem' }}
            onClick={handleSave}
            disabled={previewData.length === 0}
          >
            تایید و ذخیره در پایگاه داده
          </button>
        </div>
      </div>
    </div>
  );
};