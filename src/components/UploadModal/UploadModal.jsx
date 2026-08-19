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
      setPreviewData(processed.slice(0, 50)); // Preview first 50 rows
      window.__tempProcessedData = processed; 
    } catch (err) {
      setError(err.message || 'خطا در پردازش فایل.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-panel bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">بارگذاری و پردازش داده‌های پرونده الکترونیک</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">فایل گزارش عملکرد (XLSX)</label>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={(e) => handleFileChange(e, 'main')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">فایل لیست دستیاران (CSV) - اختیاری</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleFileChange(e, 'residents')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <p className="text-xs text-gray-500 mt-1">باید شامل ستون‌های "نام"، "نام خانوادگی" و "سال دستیاری" باشد.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end mb-4">
            <button
              onClick={processFiles}
              disabled={isProcessing || !file}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isProcessing ? 'در حال پردازش...' : 'پردازش و پیش‌نمایش'}
            </button>
          </div>

          {previewData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700">
                پیش‌نمایش داده‌های پردازش شده (۵۰ ردیف اول)
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">نام</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">دسته</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">ویزیت (V)</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">PDI</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">وضعیت (Flags)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-right">{row.name}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${row.category === 'faculty' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {row.category === 'faculty' ? 'هیئت علمی' : 'دستیار'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{row.V}</td>
                        <td className="px-4 py-2 text-right font-bold">{row.PDI.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-600">{row.flags}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition">
            انصراف
          </button>
          <button 
            onClick={handleSave}
            disabled={previewData.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            تایید و ذخیره در پایگاه داده
          </button>
        </div>
      </div>
    </div>
  );
};