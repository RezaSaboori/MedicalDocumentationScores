import React, { useState, useCallback, useEffect, useRef } from 'react';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import {
  saveUploadedDataset,
  saveResidentsList,
  getResidentsList,
  clearResidentsList,
} from '../../services/dataService';
import PreviewTable from './PreviewTable';
import './UploadModal.css';

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const UploadModal = ({ isOpen, onClose, onDataProcessed }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState({ residents: [], faculty: [] });
  const [error, setError] = useState(null);

  const [residentsData, setResidentsData] = useState([]);
  const [residentsFileName, setResidentsFileName] = useState(null);
  const [residentsSaved, setResidentsSaved] = useState(false);

  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingResidents, setIsDraggingResidents] = useState(false);

  const mainInputRef = useRef(null);
  const residentsInputRef = useRef(null);

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
    setPreview({ residents: [], faculty: [] });
    setError(null);
    if (mainInputRef.current) mainInputRef.current.value = '';
  };

  // ----- Main XLSX -----
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

  // ----- Residents CSV -----
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
      setResidentsSaved(false);
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
    setResidentsSaved(false);
    if (residentsInputRef.current) residentsInputRef.current.value = '';
  };

  const updateResidentRow = (index, field, value) => {
    setResidentsData(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setResidentsSaved(false);
  };

  const removeResidentRow = (index) => {
    setResidentsData(prev => prev.filter((_, i) => i !== index));
    setResidentsSaved(false);
  };

  const confirmSaveResidents = () => {
    saveResidentsList(residentsData, residentsFileName);
    setResidentsSaved(true);
    setTimeout(() => setResidentsSaved(false), 2500);
  };

  // ----- Process -----
  const processFiles = useCallback(async () => {
    if (!file) {
      setError('لطفاً فایل اصلی گزارش عملکرد را انتخاب یا رها کنید.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const processed = await parseAndProcessExcel(file, residentsData);
      setPreview({ residents: processed.residents, faculty: processed.faculty });
    } catch (err) {
      console.error('Pipeline Error:', err);
      setError(err.message || 'خطا در پردازش فایل.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, residentsData]);

  // ----- Preview edit/remove -----
  const updatePreviewRow = (group, index, next) => {
    setPreview(prev => {
      const rows = [...prev[group]];
      rows[index] = { ...rows[index], ...next };
      return { ...prev, [group]: rows };
    });
  };

  const removePreviewRow = (group, index) => {
    setPreview(prev => ({ ...prev, [group]: prev[group].filter((_, i) => i !== index) }));
  };

  // ----- Save dataset -----
  const handleSave = async () => {
    if (!preview.residents.length && !preview.faculty.length) return;
    try {
      const dataset = await saveUploadedDataset(preview);
      onDataProcessed(dataset);
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
      <div className="glass-transparent upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal__header">
          <h2 className="upload-modal__title">بارگذاری و پردازش داده‌های پرونده الکترونیک</h2>
          <button className="upload-modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="upload-modal__body">
          {!hasResidents && (
            <div className="residents-warning">
              ⚠️ فایل لیست دستیاران هنوز بارگذاری نشده است. برای تفکیک دقیق و تعیین سال دستیاری، آن را انتخاب یا رها کنید.
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
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
            <input ref={mainInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleMainFile(e.target.files[0])} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              فایل لیست دستیاران (CSV) — یک‌بار بارگذاری
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
                <div className="dropzone__hint">ستون‌ها: «نام»، «نام خانوادگی»، «سال دستیاری»</div>
              </div>
            ) : (
              <div className="residents-card">
                <div className="residents-card__header">
                  <div className="residents-card__title">
                    ✅ لیست دستیاران {residentsFileName ? `(${residentsFileName})` : ''} — {residentsData.length} رکورد
                  </div>
                  <div className="residents-card__actions">
                    {residentsSaved && <span className="residents-saved">✔ ذخیره شد</span>}
                    <button className="btn-sm btn-sm--success" onClick={confirmSaveResidents} title="تأیید و ذخیره لیست دستیاران">
                      <SaveIcon /> ذخیره
                    </button>
                    <button className="btn-sm btn-sm--ghost" onClick={() => residentsInputRef.current?.click()}>
                      بارگذاری مجدد
                    </button>
                    <button className="btn-sm btn-sm--danger" onClick={removeResidents}>حذف لیست</button>
                  </div>
                </div>

                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>#</th><th>نام</th><th>سال دستیاری</th><th>عملیات</th></tr>
                    </thead>
                    <tbody>
                      {residentsData.map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <input type="text" value={row.name} onChange={(e) => updateResidentRow(idx, 'name', e.target.value)} />
                          </td>
                          <td>
                            <input type="text" value={row.year} onChange={(e) => updateResidentRow(idx, 'year', e.target.value)} />
                          </td>
                          <td>
                            <button className="btn-sm btn-sm--danger" onClick={() => removeResidentRow(idx)}>حذف</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <input ref={residentsInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleResidentsFile(e.target.files[0])} />
          </div>

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

          <PreviewTable
            title="دستیاران (فراگیران)"
            rows={preview.residents}
            onRowChange={(i, next) => updatePreviewRow('residents', i, next)}
            onRowRemove={(i) => removePreviewRow('residents', i)}
          />

          <PreviewTable
            title="هیئت علمی (ترکیب فراگیران)"
            rows={preview.faculty}
            onRowChange={(i, next) => updatePreviewRow('faculty', i, next)}
            onRowRemove={(i) => removePreviewRow('faculty', i)}
          />
        </div>

        <div className="upload-modal__footer">
          <button className="btn-sm btn-sm--ghost" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>انصراف</button>
          <button
            className="btn-sm btn-sm--success"
            style={{ padding: '0.5rem 1.25rem' }}
            onClick={handleSave}
            disabled={!preview.residents.length && !preview.faculty.length}
          >
            تایید و ذخیره در پایگاه داده
          </button>
        </div>
      </div>
    </div>
  );
};