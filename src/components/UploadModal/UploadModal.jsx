import React, { useState, useRef, useEffect, useMemo } from 'react';
import { uploadDataToServer, saveResidentsMaster, fetchDashboardData } from '../../services/dataService';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import { useDashboard } from '../../context/DashboardContext';
import { useModeIndicator } from '../../hooks/useModeIndicator';
import { DropdownInput } from '../inputs/DropdownInput';
import PreviewTable from './PreviewTable';
import ResidentsManager from './ResidentsTable';
import './UploadModal.css';

const TABS = { UPLOAD: 'upload', DATABASE: 'database' };

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export const UploadModal = ({ isOpen, onClose, onDataUploaded, onDataProcessed }) => {
  const { refresh, snapshots, refreshResidentsMaster, residentsMaster } = useDashboard();

  const [tab, setTab] = useState(TABS.UPLOAD);
  const tablistRef = useRef(null);
  useModeIndicator(tablistRef, `upload-tab-${tab}`, [tab]);

  const [excelFile, setExcelFile] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [previewResidents, setPreviewResidents] = useState([]);
  const [previewFaculty, setPreviewFaculty] = useState([]);

  const [residentsRows, setResidentsRows] = useState([]);
  const [residentsSavedMsg, setResidentsSavedMsg] = useState(false);

  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [openedPeriod, setOpenedPeriod] = useState(null);

  const [dragExcel, setDragExcel] = useState(false);
  const [dragResidents, setDragResidents] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const excelInputRef = useRef(null);
  const residentsInputRef = useRef(null);

  const visible = isOpen === undefined ? true : Boolean(isOpen);

  // ── UNCONDITIONAL HOOKS (Rules of Hooks compliance) ──────────────────────

  const datasetYears = useMemo(
    () => [...new Set((snapshots || []).map(s => String(s.period).split('/')[0]))].sort(),
    [snapshots]
  );

  const datasetMonths = useMemo(() => {
    const list = (snapshots || []).filter(s => yearFilter === 'all' || String(s.period).startsWith(`${yearFilter}/`));
    return [...new Set(list.map(s => String(s.period).split('/')[1]))].sort();
  }, [snapshots, yearFilter]);

  const filteredSnapshots = useMemo(
    () =>
      (snapshots || []).filter(s => {
        const [y, m] = String(s.period).split('/');
        if (yearFilter !== 'all' && y !== yearFilter) return false;
        if (monthFilter !== 'all' && m !== monthFilter) return false;
        return true;
      }),
    [snapshots, yearFilter, monthFilter]
  );

  // Lock page scroll while the modal is open
  useEffect(() => {
    if (!visible) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Seed residents rows from the master registry on open
  useEffect(() => {
    if (visible) {
      setTab(TABS.UPLOAD);
      setResidentsRows((residentsMaster || []).map(r => ({ name: r.name, year: r.year })));
      setError(null);
      setSuccess(false);
      setOpenedPeriod(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── EARLY RETURN ─────────────────────────────────────────────────────────
  if (!visible) return null;

  // ── HANDLERS ─────────────────────────────────────────────────────────────

  const applyProcessed = (result) => {
    setProcessed(result);
    setPreviewResidents(result.residents);
    setPreviewFaculty(result.faculty);
    setOpenedPeriod(null);
  };

  const handleExcelFile = async (file) => {
    if (!file) return;
    setExcelFile(file);
    setError(null);
    setParsing(true);
    try {
      applyProcessed(await parseAndProcessExcel(file, residentsMaster || []));
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
    setError(null);
    setParsing(true);
    try {
      const list = await parseResidentsCSV(file);
      setResidentsRows(list);
    } catch (err) {
      setError(err.message || 'خطا در پردازش فایل CSV رزیدنت‌ها.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveResidents = async () => {
    setLoading(true);
    setError(null);
    try {
      await saveResidentsMaster(residentsRows);
      if (refreshResidentsMaster) await refreshResidentsMaster();
      setResidentsSavedMsg(true);
      setTimeout(() => setResidentsSavedMsg(false), 2000);
    } catch (err) {
      setError(err.message || 'خطا در ذخیره‌سازی مشخصات رزیدنت‌ها.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearResidents = () => setResidentsRows([]);

  const handleSubmit = async () => {
    if (!processed || !excelFile) {
      setError('لطفاً ابتدا فایل اکسل گزارش پرونده‌ها را انتخاب کنید.');
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
        residentsList: residentsMaster || [],
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

  const handleOpenDataset = async (period) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData(period);
      const rows = result.current?.data || [];
      setPreviewResidents(rows.filter(r => r.category === 'resident'));
      setPreviewFaculty(rows.filter(r => r.category === 'faculty'));
      setOpenedPeriod(period);
    } catch (err) {
      setError(err.message || 'خطا در دریافت داده‌های بازه زمانی.');
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = ['همه سال‌ها', ...datasetYears.map(y => `سال ${y}`)];
  const monthOptions = ['همه ماه‌ها', ...datasetMonths.map(m => `ماه ${m}`)];
  const yearValue = yearFilter === 'all' ? 'همه سال‌ها' : `سال ${yearFilter}`;
  const monthValue = monthFilter === 'all' ? 'همه ماه‌ها' : `ماه ${monthFilter}`;

  const handleYearChange = (val) => {
    setYearFilter(val === 'همه سال‌ها' ? 'all' : val.replace('سال ', ''));
    setMonthFilter('all');
  };
  
  const handleMonthChange = (val) => {
    setMonthFilter(val === 'همه ماه‌ها' ? 'all' : val.replace('ماه ', ''));
  };

  const excelDropProps = {
    onClick: () => excelInputRef.current?.click(),
    onDragOver: (e) => { e.preventDefault(); setDragExcel(true); },
    onDragLeave: () => setDragExcel(false),
    onDrop: (e) => {
      e.preventDefault();
      setDragExcel(false);
      handleExcelFile(e.dataTransfer.files?.[0]);
    },
  };

  const residentsDropProps = {
    onClick: () => residentsInputRef.current?.click(),
    onDragOver: (e) => { e.preventDefault(); setDragResidents(true); },
    onDragLeave: () => setDragResidents(false),
    onDrop: (e) => {
      e.preventDefault();
      setDragResidents(false);
      handleResidentsFile(e.dataTransfer.files?.[0]);
    },
  };

  const previewHandlers = (setter) => ({
    onRowChange: (idx, buffer) => setter(prev => prev.map((r, i) => (i === idx ? { ...r, ...buffer } : r))),
    onRowRemove: (idx) => setter(prev => prev.filter((_, i) => i !== idx)),
  });

  return (
    <div className="upload-modal-overlay">
      <div className="upload-modal-backdrop" onClick={onClose} />

      <div className="upload-modal-panel glass u-container">
        <div className="upload-modal-header">
          <div className="upload-modal-title">بارگذاری داده‌های جدید</div>

          <div className="upload-modal-tablist glass" role="tablist" ref={tablistRef}>
            <button
              id="upload-tab-upload"
              className={`upload-modal-tab ${tab === TABS.UPLOAD ? 'upload-modal-tab--active' : ''}`}
              onClick={() => setTab(TABS.UPLOAD)}
            >
              فایل جدید
            </button>
            <button
              id="upload-tab-database"
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
              {(!residentsMaster || residentsMaster.length === 0) && (
                <div className="upload-modal-warning u-container">
                  <span>هنوز «مشخصات رزیدنت‌ها» بارگذاری نشده است. برای بارگذاری آن به سربرگ «پایگاه داده» بروید.</span>
                  <button
                    className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost"
                    onClick={() => setTab(TABS.DATABASE)}
                  >
                    رفتن به پایگاه داده
                  </button>
                </div>
              )}

              <section className="upload-modal-section glass u-container">
                <div className="upload-modal-section-title">فایل اکسل گزارش پرونده‌ها</div>
                <div
                  className={`upload-modal-dropzone ${dragExcel ? 'upload-modal-dropzone--active' : ''}`}
                  {...excelDropProps}
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

              <PreviewTable title="پیش‌نمایش فراگیران" rows={previewResidents} {...previewHandlers(setPreviewResidents)} />
              <PreviewTable title="پیش‌نمایش هیئت علمی" rows={previewFaculty} {...previewHandlers(setPreviewFaculty)} />

              {error && <div className="upload-modal-error u-container">{error}</div>}
            </>
          ) : (
            <>
              <section className="upload-modal-section glass u-container">
                <div className="upload-modal-section-title">مشخصات رزیدنت‌ها</div>
                <ResidentsManager
                  rows={residentsRows}
                  onRowsChange={setResidentsRows}
                  onSave={handleSaveResidents}
                  onClear={handleClearResidents}
                  saving={loading}
                  saved={residentsSavedMsg}
                  dropProps={residentsDropProps}
                  dragActive={dragResidents}
                />
                <input
                  ref={residentsInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => handleResidentsFile(e.target.files?.[0])}
                />
              </section>

              <section className="upload-modal-section glass u-container">
                <div className="upload-modal-section-title">بازه‌های زمانی ذخیره‌شده</div>

                <div className="upload-modal-dataset-filters">
                  <DropdownInput
                    dir="rtl"
                    busy={loading}
                    options={yearOptions}
                    value={yearValue}
                    onChange={handleYearChange}
                    chevronIcon={<ChevronIcon />}
                    placeholder="انتخاب سال..."
                  />
                  <DropdownInput
                    dir="rtl"
                    busy={loading}
                    options={monthOptions}
                    value={monthValue}
                    onChange={handleMonthChange}
                    chevronIcon={<ChevronIcon />}
                    placeholder="انتخاب ماه..."
                  />
                </div>

                {filteredSnapshots.length === 0 && (
                  <div className="upload-modal-empty">هیچ بازه زمانی ذخیره‌شده‌ای یافت نشد.</div>
                )}

                {filteredSnapshots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="upload-modal-dataset upload-modal-dataset--btn"
                    onClick={() => handleOpenDataset(s.period)}
                  >
                    <div>
                      <div>{s.period}</div>
                      <div className="upload-modal-dataset__meta">
                        <span>شروع: {s.start_date || '—'}</span>
                        <span>پایان: {s.end_date || '—'}</span>
                      </div>
                    </div>
                    <span className="upload-modal-btn upload-modal-btn--sm upload-modal-btn--ghost">مشاهده</span>
                  </button>
                ))}
              </section>

              {openedPeriod && (
                <>
                  <div className="upload-modal-section-title">داده‌های بازه {openedPeriod}</div>
                  <PreviewTable title="فراگیران" rows={previewResidents} {...previewHandlers(setPreviewResidents)} />
                  <PreviewTable title="هیئت علمی" rows={previewFaculty} {...previewHandlers(setPreviewFaculty)} />
                </>
              )}

              {error && <div className="upload-modal-error u-container">{error}</div>}
            </>
          )}
        </div>

        <div className="upload-modal-footer">
          {success && <span className="upload-modal-saved">داده‌ها با موفقیت در پایگاه داده ذخیره شد.</span>}
          <button className="upload-modal-btn upload-modal-btn--cancel" onClick={onClose} disabled={loading}>
            انصراف
          </button>
          {tab === TABS.UPLOAD && (
            <button
              className="upload-modal-btn blue-glass upload-modal-btn--solid"
              onClick={handleSubmit}
              disabled={loading || parsing || !excelFile}
            >
              {loading ? 'در حال ذخیره‌سازی...' : 'ذخیره در پایگاه داده'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;