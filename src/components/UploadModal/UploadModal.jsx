import React, { useState, useCallback, useEffect, useRef } from 'react';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import {
  saveUploadedDataset,
  saveResidentsList,
  getResidentsList,
  clearResidentsList,
  getUploadedDatasets,
  deleteUploadedDataset,
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

const TABS = { ENTRY: 'entry', DATABASE: 'database' };

export const UploadModal = ({ isOpen, onClose, onDataProcessed }) => {
  const [tab, setTab] = useState(TABS.ENTRY);

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState({ residents: [], faculty: [] });
  const [error, setError] = useState(null);

  const [residentsData, setResidentsData] = useState([]);
  const [residentsFileName, setResidentsFileName] = useState(null);
  const [residentsSaved, setResidentsSaved] = useState(false);

  const [datasets, setDatasets] = useState([]);

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

  useEffect(() => {
    if (isOpen && tab === TABS.DATABASE) setDatasets(getUploadedDatasets());
  }, [isOpen, tab]);

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

  const handleDeleteDataset = async (id) => {
    await deleteUploadedDataset(id);
    setDatasets(getUploadedDatasets());
  };

  if (!isOpen) return null;

  const hasResidents = residentsData.length > 0;
  const hasPreview = preview.residents.length > 0 || preview.faculty.length > 0;

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div
        className="glass-transparent upload-modal-panel u-container u-container--xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <header className="upload-modal-header">
          <span className="upload-modal-title">بارگذاری و پردازش داده‌های پرونده الکترونیک</span>
          <button className="upload-modal-close-btn" onClick={onClose} aria-label="بستن">&times;</button>
        </header>

        {/* ── BODY ── */}
        <div className="upload-modal-body custom-scrollbar">
          {/* Pill tablist — ورود داده / دیتابیس */}
          <div className="upload-modal-tablist glass" role="tablist" aria-label="بخش‌های بارگذاری">
            <button
              role="tab"
              type="button"
              aria-selected={tab === TABS.ENTRY}
              className={`upload-modal-tab${tab === TABS.ENTRY ? ' upload-modal-tab--active blue-glass' : ''}`}
              onClick={() => setTab(TABS.ENTRY)}
            >
              ورود داده
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={tab === TABS.DATABASE}
              className={`upload-modal-tab${tab === TABS.DATABASE ? ' upload-modal-tab--active blue-glass' : ''}`}
              onClick={() => setTab(TABS.DATABASE)}
            >
              دیتابیس
            </button>
          </div>

          {tab === TABS.ENTRY ? (
            <>
              {!hasResidents && (
                <div className="upload-modal-warning u-container u-container--md">
                  ⚠️ فایل لیست دستیاران بارگذاری نشده است؛ برای تعیین سال دستیاری آن را انتخاب یا رها کنید.
                  <div
                    className={`upload-modal-dropzone upload-modal-dropzone--compact ${isDraggingResidents ? 'upload-modal-dropzone--active' : ''}`}
                    onClick={() => residentsInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingResidents(true); }}
                    onDragLeave={() => setIsDraggingResidents(false)}
                    onDrop={onResidentsDrop}
                  >
                    فایل CSV دستیاران را اینجا رها کنید یا کلیک کنید
                    <div className="upload-modal-dropzone__hint">ستون‌ها: «نام»، «نام خانوادگی»، «سال دستیاری»</div>
                  </div>
                </div>
              )}

              {hasResidents && (
                <div className="upload-modal-empty">
                  لیست دستیاران فعال است ({residentsData.length} رکورد) — مشاهده و ویرایش در زبانهٔ «دیتابیس».
                </div>
              )}

              {error && <div className="upload-modal-error u-container u-container--md">{error}</div>}

              <section className="glass u-container u-container--lg upload-modal-section">
                <div className="upload-modal-section-title">فایل گزارش عملکرد (XLSX)</div>
                <div
                  className={`upload-modal-dropzone ${isDraggingMain ? 'upload-modal-dropzone--active' : ''}`}
                  onClick={() => mainInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
                  onDragLeave={() => setIsDraggingMain(false)}
                  onDrop={onMainDrop}
                >
                  فایل را اینجا رها کنید یا برای انتخاب کلیک کنید
                  <div className="upload-modal-dropzone__hint">فرمت‌های مجاز: XLSX, XLS</div>
                  {file && <div className="upload-modal-dropzone__filename">📄 {file.name}</div>}
                </div>
              </section>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="upload-modal-btn blue-glass upload-modal-btn--solid"
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
            </>
          ) : (
            <>
              {/* Residents year data */}
              <section className="glass u-container u-container--lg upload-modal-section">
                <div className="upload-modal-header" style={{ paddingBottom: 0 }}>
                  <span className="upload-modal-section-title">
                    سال دستیاری رزیدنت‌ها {residentsFileName ? `(${residentsFileName})` : ''} — {residentsData.length} رکورد
                  </span>
                  <div className="upload-modal-section-actions">
                    {residentsSaved && <span className="upload-modal-saved">✔ ذخیره شد</span>}
                    <button className="upload-modal-btn upload-modal-btn--sm green-glass upload-modal-btn--solid" onClick={confirmSaveResidents} title="تأیید و ذخیره لیست دستیاران">
                      <SaveIcon /> ذخیره
                    </button>
                    <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost" onClick={() => residentsInputRef.current?.click()}>
                      بارگذاری مجدد
                    </button>
                    <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--danger" onClick={removeResidents}>
                      حذف لیست
                    </button>
                  </div>
                </div>

                {hasResidents ? (
                  <div className="upload-modal-table-wrapper custom-scrollbar">
                    <table className="data-table">
                      <thead>
                        <tr><th>#</th><th>نام</th><th>سال دستیاری</th><th>عملیات</th></tr>
                      </thead>
                      <tbody>
                        {residentsData.map((row, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <input className="upload-modal-input" type="text" value={row.name} onChange={(e) => updateResidentRow(idx, 'name', e.target.value)} />
                            </td>
                            <td>
                              <input className="upload-modal-input" type="text" value={row.year} onChange={(e) => updateResidentRow(idx, 'year', e.target.value)} />
                            </td>
                            <td>
                              <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--danger" onClick={() => removeResidentRow(idx)}>حذف</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className={`upload-modal-dropzone ${isDraggingResidents ? 'upload-modal-dropzone--active' : ''}`}
                    onClick={() => residentsInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingResidents(true); }}
                    onDragLeave={() => setIsDraggingResidents(false)}
                    onDrop={onResidentsDrop}
                  >
                    فایل CSV دستیاران را اینجا رها کنید یا کلیک کنید
                  </div>
                )}
              </section>

              {/* Historical datasets */}
              <section className="glass u-container u-container--lg upload-modal-section">
                <div className="upload-modal-section-title">دیتاست‌های ذخیره‌شدهٔ قبلی</div>
                {datasets.length === 0 ? (
                  <div className="upload-modal-empty">هنوز دیتاستی ذخیره نشده است.</div>
                ) : (
                  datasets.map((d) => (
                    <div className="upload-modal-dataset" key={d.id}>
                      <div>
                        <div>{d.name}</div>
                        <div className="upload-modal-dataset__meta">
                          <span>دستیار: {d.summary?.residentCount ?? 0}</span>
                          <span>هیئت علمی: {d.summary?.facultyCount ?? 0}</span>
                          <span>میانگین PDI دستیاران: {Number(d.summary?.residentsAvgPDI || 0).toFixed(1)}</span>
                          <span>میانگین PDI اساتید: {Number(d.summary?.facultyAvgPDI || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <button className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--danger" onClick={() => handleDeleteDataset(d.id)}>
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </section>
            </>
          )}

          {/* Hidden file inputs shared by both tabs */}
          <input ref={mainInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleMainFile(e.target.files[0])} />
          <input ref={residentsInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleResidentsFile(e.target.files[0])} />
        </div>

        {/* ── FOOTER ── */}
        <footer className="upload-modal-footer">
          <button className="upload-modal-btn upload-modal-btn--cancel" onClick={onClose}>انصراف</button>
          <button
            className="upload-modal-btn green-glass upload-modal-btn--solid"
            onClick={handleSave}
            disabled={!hasPreview}
          >
            <SaveIcon /> تایید و ذخیره
          </button>
        </footer>
      </div>
    </div>
  );
};