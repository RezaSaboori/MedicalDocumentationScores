import React, { useState } from 'react';
import { uploadDataToServer } from '../../services/dataService';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onDataUploaded }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [residentsFile, setResidentsFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'excel') setExcelFile(file);
    if (type === 'residents') setResidentsFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!excelFile) {
      setError('لطفاً فایل اکسل وضعیت پرونده‌ها را انتخاب کنید.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let residentsData = [];
      if (residentsFile) {
        residentsData = await parseResidentsCSV(residentsFile);
      }

      // 1. Process files in memory
      const processed = await parseAndProcessExcel(excelFile, residentsData);

      // 2. Prepare payload for backend
      const payload = {
        documents: processed.documents,
        aggregated: {
          residents: processed.residents,
          faculty: processed.faculty,
        },
        period: processed.period,
        startDate: processed.startDate,
        endDate: processed.endDate,
      };

      // 3. Send to SQLite backend
      await uploadDataToServer(payload);
      
      setSuccess(true);
      setExcelFile(null);
      setResidentsFile(null);
      
      // Trigger dashboard refresh
      if (onDataUploaded) onDataUploaded();
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || 'خطا در پردازش یا ذخیره‌سازی داده‌ها در پایگاه داده.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>بارگذاری داده‌های جدید</h2>
        
        <div className="form-group">
          <label>فایل اکسل وضعیت پرونده‌ها (MedicalDocsStatus):</label>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, 'excel')} />
        </div>

        <div className="form-group">
          <label>فایل CSV رزیدنت‌ها (اختیاری):</label>
          <input type="file" accept=".csv" onChange={(e) => handleFileChange(e, 'residents')} />
        </div>

        {error && <div className="error-msg" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}
        {success && <div className="success-msg" style={{ color: 'green', margin: '10px 0', fontSize: '14px' }}>داده‌ها با موفقیت در پایگاه داده ذخیره شد!</div>}

        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading}>انصراف</button>
          <button onClick={handleSubmit} disabled={loading || !excelFile}>
            {loading ? 'در حال پردازش و ذخیره...' : 'ذخیره در پایگاه داده'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;