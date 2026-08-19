import React, { useState, useCallback } from 'react';
import { parseAndProcessExcel, parseResidentsCSV } from '../../utils/excelPipeline';
import { saveUploadedDataset } from '../../services/dataService';

export const UploadModal = ({ isOpen, onClose, onDataProcessed }) => {
  const [file, setFile] = useState(null);
  const [residentsFile, setResidentsFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e, type) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (type === 'main') setFile(selectedFile);
      else setResidentsFile(selectedFile);
      setError(null);
    }
  };

  const processFiles = useCallback(async () => {
    if (!file) {
      setError('لطفاً فایل اصلی گزارش عملکرد را انتخاب کنید.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let residentsData = [];
      if (residentsFile) {
        residentsData = await parseResidentsCSV(residentsFile);
      }

      const processed = await parseAndProcessExcel(file, residentsData);
      setPreviewData(processed.slice(0, 50)); 
      window.__tempProcessedData = processed; 
    } catch (err) {
      console.error("Pipeline Error:", err);
      setError(err.message || 'خطا در پردازش فایل. لطفاً کنسول مرورگر (F12) را بررسی کنید.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, residentsFile]);

  const handleSave = async () => {
    const fullData = window.__tempProcessedData;
    if (!fullData) return;

    try {
      await saveUploadedDataset(fullData);
      onDataProcessed(fullData);
      onClose();
      setFile(null);
      setResidentsFile(null);
      setPreviewData([]);
      window.__tempProcessedData = null;
    } catch (err) {
      setError('خطا در ذخیره‌سازی داده‌ها.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem'
      }}
      onClick={onClose} // Close when clicking outside
    >
      <div 
        style={{
          backgroundColor: '#fff', borderRadius: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          width: '100%', maxWidth: '60rem', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            بارگذاری و پردازش داده‌های پرونده الکترونیک
          </h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
          >
            &times;
          </button>
        </div>
        
        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                فایل گزارش عملکرد (XLSX)
              </label>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={(e) => handleFileChange(e, 'main')}
                style={{ display: 'block', width: '100%', fontSize: '0.875rem', color: '#6b7280' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                فایل لیست دستیاران (CSV) - اختیاری
              </label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleFileChange(e, 'residents')}
                style={{ display: 'block', width: '100%', fontSize: '0.875rem', color: '#6b7280' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                باید شامل ستون‌های "نام"، "نام خانوادگی" و "سال دستیاری" باشد.
              </p>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={processFiles}
              disabled={isProcessing || !file}
              style={{
                backgroundColor: isProcessing || !file ? '#9ca3af' : '#2563eb',
                color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.375rem',
                border: 'none', cursor: isProcessing || !file ? 'not-allowed' : 'pointer',
                fontWeight: '500', transition: 'background-color 0.2s'
              }}
            >
              {isProcessing ? 'در حال پردازش...' : 'پردازش و پیش‌نمایش'}
            </button>
          </div>

          {previewData.length > 0 && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: '500', color: '#374151' }}>
                پیش‌نمایش داده‌های پردازش شده (۵۰ ردیف اول)
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '24rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'right' }}>
                  <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '0.5rem 1rem', fontWeight: '500', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>نام</th>
                      <th style={{ padding: '0.5rem 1rem', fontWeight: '500', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>دسته</th>
                      <th style={{ padding: '0.5rem 1rem', fontWeight: '500', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>ویزیت (V)</th>
                      <th style={{ padding: '0.5rem 1rem', fontWeight: '500', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>PDI</th>
                      <th style={{ padding: '0.5rem 1rem', fontWeight: '500', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>وضعیت (Flags)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td>
                        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                            backgroundColor: row.category === 'faculty' ? '#f3e8ff' : '#dbeafe',
                            color: row.category === 'faculty' ? '#6b21a8' : '#1e40af'
                          }}>
                            {row.category === 'faculty' ? 'هیئت علمی' : 'دستیار'}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb' }}>{row.V}</td>
                        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>{row.PDI.toFixed(2)}</td>
                        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#4b5563' }}>{row.flags}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderRadius: '0 0 0.75rem 0.75rem' }}>
          <button 
            onClick={onClose} 
            style={{ padding: '0.5rem 1rem', color: '#374151', backgroundColor: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}
          >
            انصراف
          </button>
          <button 
            onClick={handleSave}
            disabled={previewData.length === 0}
            style={{
              padding: '0.5rem 1.5rem', backgroundColor: previewData.length === 0 ? '#9ca3af' : '#16a34a',
              color: 'white', border: 'none', borderRadius: '0.375rem', cursor: previewData.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            تایید و ذخیره در پایگاه داده
          </button>
        </div>
      </div>
    </div>
  );
};
