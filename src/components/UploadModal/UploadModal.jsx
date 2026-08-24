import React, { useState, useRef, useEffect } from 'react';
import { uploadDataToServer, fetchResidents } from '../../services/dataService';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import { useDashboard } from '../../context/DashboardContext';
import PreviewTable from './PreviewTable';
import ResidentsTable from './ResidentsTable';
import './UploadModal.css';

const TABS = { UPLOAD: 'upload', DATABASE: 'database' };

export const UploadModal = ({ isOpen, onClose, onDataUploaded, onDataProcessed }) => {
  const { refresh, snapshots, selectedPeriod } = useDashboard();

  const [tab, setTab] = useState(TABS.UPLOAD);

  const [excelFile, setExcelFile] = useState(null);
  const [residentsFile, setResidentsFile] = useState(null);
  const [residentsList, setResidentsList] = useState([]);

  const [processed, setProcessed] = useState(null);
  const [previewResidents, setPreviewResidents] = useState([]);
  const [previewFaculty, setPreviewFaculty] = useState([]);

  const [dragExcel, setDragExcel] = useState(false);
  const [dragResidents, setDragResidents] = useState(false);

  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dbResidents, setDbResidents] = useState([]);

  useEffect(() => {
    if (tab === TABS.DATABASE && selectedPeriod) {
      fetchResidents(selectedPeriod).then(setDbResidents);
    }
  }, [tab, selectedPeriod]);

  const excelInputRef = useRef(null);
  const residentsInputRef = useRef(null);

  const visible = isOpen === undefined ? true : Boolean(isOpen);

  useEffect(() => {
    if (visible) {
      setTab(TABS.UPLOAD);
      setError(null);
      setSuccess(false);
    }
  }, [visible]);

  if (!visible) return null;

  const applyProcessed = (result) => {
    setProcessed(result);
    setPreviewResidents(result.residents);
    setPreviewFaculty(result.faculty);
  };

  const handleExcelFile = async (file) => {
    if (!file) return;
    setExcelFile(file);
    setError(null);
    setParsing(true);
    try {
      applyProcessed(await parseAndProcessExcel(file, residentsList));
    } catch (err) {
      setProcessed(null);
      setPreviewResidents([]);
      setPreviewFaculty([]);
      setError(err.message || 'خطا در پردازش فایل اکسل.');
    } finally {
      setParsing(false);
    }
  };

  const handleResidentsFile = async (file) => {
    if (!file) return;
    setResidentsFile(file);
    setError(null);
    setParsing(true);
    try {
      const list = await parseResidentsCSV(file);
      setResidentsList(list);
      if (excelFile) applyProcessed(await parseAndProcessExcel(excelFile, list));
    } catch (err) {
      setError(err.message || 'خطا در پردازش فایل CSV رزیدنت‌ها.');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!processed || !excelFile) {
      setError('لطفاً ابتدا فایل اکسل وضعیت پرونده‌ها را انتخاب کنید.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await uploadDataToServer({
        documents: processed.documents,
        aggregated: { residents: previewResidents, faculty: previewFaculty },
        period: processed.period,
        startDate: processed.startDate,
        endDate: processed.endDate,
        residentsList: residentsList,
      });

      setSuccess(true);

      if (refresh) await refresh();
      if (onDataUploaded) onDataUploaded();
      if (onDataProcessed) onDataProcessed();

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'خطا در ذخیره‌سازی داده‌ها در پایگاه داده.');
    } finally {
      setLoading(false);
    }
  };

  const dropzoneProps = (type) => ({
    onClick: () => (type === 'excel' ? excelInputRef.current : residentsInputRef.current)?.click(),
    onDragOver: (e) => {
      e.preventDefault();
      (type === 'excel' ? setDragExcel : setDragResidents)(true);
    },
    onDragLeave: () => (type === 'excel' ? setDragExcel : setDragResidents)(false),
    onDrop: (e) => {
      e.preventDefault();
      (type === 'excel' ? setDragExcel : setDragResidents)(false);
      const file = e.dataTransfer.files?.[0];
      if (type === 'excel') handleExcelFile(file);
      else handleResidentsFile(file);
    },
  });

  return (
    <div className="upload-modal-overlay">
      <div className="upload-modal-backdrop" onClick={onClose} />

      <div className="upload-modal-panel glass u-container">
        <div className="upload-modal-header">
          <div className="upload-modal-title">بارگذاری داده‌های جدید</div>

          <div className="upload-modal-tablist glass" role="tablist">
            <button
              className={`upload-modal-tab ${tab === TABS.UPLOAD ? 'upload-modal-tab--active' : ''}`}
              onClick={() => setTab(TABS.UPLOAD)}
            >
              فایل جدید
            </button>
            <button
              className={`upload-modal-tab ${tab === TABS.DATABASE ? 'upload-modal-tab--active' : ''}`}
              onClick={() => setTab(TABS.DATABASE)}
            >
              پایگاه داده
            </button>
          </div>

          <button className="upload-modal-close-btn" onClick={onClose} aria-label="بستن">
            ×
          </button>
        </div>

        <div className="upload-modal-body custom-scrollbar">
          {tab === TABS.UPLOAD ? (
            <>
              <section className="upload-modal-section glass u-container">
                <div className="upload-modal-section-title">فایل اکسل وضعیت پرونده‌ها</div>
                <div
                  className={`upload-modal-dropzone ${dragExcel ? 'upload-modal-dropzone--active' : ''}`}
                  {...dropzoneProps('excel')}
                >
                  <div>برای انتخاب فایل کلیک کنید یا فایل را اینجا رها کنید</div>
                  <div className="upload-modal-dropzone__hint">فرمت مجاز: xlsx / xls</div>
                  {excelFile && <div className="upload-modal-dropzone__filename">{excelFile.name}</div>}
                  {parsing && <div className="upload-modal-dropzone__hint">در حال پردازش...</div>}
                </div>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => handleExcelFile(e.target.files?.[0])}
                />
              </section>

              <section className="upload-modal-section glass u-container">
                <div className="upload-modal-section-title">فایل CSV رزیدنت‌ها (اختیاری)</div>
                <div
                  className={`upload-modal-dropzone upload-modal-dropzone--compact ${dragResidents ? 'upload-modal-dropzone--active' : ''}`}
                  {...dropzoneProps('residents')}
                >
                  <div>برای انتخاب فایل کلیک کنید یا فایل را اینجا رها کنید</div>
                  <div className="upload-modal-dropzone__hint">فرمت مجاز: csv</div>
                  {residentsFile && <div className="upload-modal-dropzone__filename">{residentsFile.name}</div>}
                </div>
                <input
                  ref={residentsInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => handleResidentsFile(e.target.files?.[0])}
                />
                {residentsList.length > 0 && (
                  <ResidentsTable
                    rows={residentsList}
                    onRowChange={(idx, buffer) =>
                      setResidentsList(prev => prev.map((r, i) => (i === idx ? { ...r, ...buffer } : r)))
                    }
                    onRowRemove={(idx) => setResidentsList(prev => prev.filter((_, i) => i !== idx))}
                  />
                )}
              </section>

              <PreviewTable
                title="پیش‌نمایش فراگیران"
                rows={previewResidents}
                onRowChange={(idx, buffer) =>
                  setPreviewResidents(prev => prev.map((r, i) => (i === idx ? { ...r, ...buffer } : r)))
                }
                onRowRemove={(idx) => setPreviewResidents(prev => prev.filter((_, i) => i !== idx))}
              />

              <PreviewTable
                title="پیش‌نمایش هیئت علمی"
                rows={previewFaculty}
                onRowChange={(idx, buffer) =>
                  setPreviewFaculty(prev => prev.map((r, i) => (i === idx ? { ...r, ...buffer } : r)))
                }
                onRowRemove={(idx) => setPreviewFaculty(prev => prev.filter((_, i) => i !== idx))}
              />

              {error && <div className="upload-modal-error u-container">{error}</div>}
            </>
          ) : (
            <section className="upload-modal-section glass u-container">
              <div className="upload-modal-section-title">بازه‌های زمانی ذخیره‌شده</div>
              {(!snapshots || snapshots.length === 0) && (
                <div className="upload-modal-empty">هیچ داده‌ای در پایگاه داده ذخیره نشده است.</div>
              )}
              {(snapshots || []).map((s) => (
                <div key={s.id} className="upload-modal-dataset">
                  <div>
                    <div>{s.period}</div>
                    <div className="upload-modal-dataset__meta">
                      <span>شروع: {s.start_date || '—'}</span>
                      <span>پایان: {s.end_date || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}

              {dbResidents.length > 0 && (
                <section className="upload-modal-section glass u-container" style={{ marginTop: 'var(--spacing-lg)' }}>
                  <div className="upload-modal-section-title">لیست رزیدنت‌های این بازه ({dbResidents.length})</div>
                  <div className="upload-modal-table-wrapper custom-scrollbar">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>سال دستیاری</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbResidents.map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td>{r.year || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </section>
          )}
        </div>

        <div className="upload-modal-footer">
          {success && <span className="upload-modal-saved">داده‌ها با موفقیت در پایگاه داده ذخیره شد.</span>}
          <button className="upload-modal-btn upload-modal-btn--cancel" onClick={onClose} disabled={loading}>
            انصراف
          </button>
          <button
            className="upload-modal-btn blue-glass upload-modal-btn--solid"
            onClick={handleSubmit}
            disabled={loading || parsing || !excelFile}
          >
            {loading ? 'در حال ذخیره‌سازی...' : 'ذخیره در پایگاه داده'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;