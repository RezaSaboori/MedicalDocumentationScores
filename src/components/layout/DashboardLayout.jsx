import React, { useState } from 'react';
import KpiCards from '../kpis/KpiCards';
import DashboardFilters from '../filters/DashboardFilters';
import GroupDonutChart from '../charts/GroupDonutChart';
import FlagMembershipChart from '../charts/FlagMembershipChart';
import LoadVsQualityChart from '../charts/LoadVsQualityChart';
import QualityMixChart from '../charts/QualityMixChart';
import PdiRankingChart from '../charts/PdiRankingChart';
import AuditTable from '../table/AuditTable';
import ModeToggle from './ModeToggle';
import { UploadModal } from '../UploadModal/UploadModal';
import FacultyImpactChart from '../charts/FacultyImpactChart';
import { useDashboard } from '../../context/DashboardContext';
import { DASHBOARD_MODES } from '../../utils/constants';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { mode, setMode, loading, filters } = useDashboard();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleDataProcessed = () => {
    window.location.reload();
  };

  return (
    <div className="page-content dashboard-wrapper">
      <div className="dashboard-header">
        <ModeToggle mode={mode} onModeChange={setMode} busy={loading} />
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="upload-fab glass"
          title="بارگذاری فایل جدید"
          aria-label="بارگذاری فایل جدید"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </button>
      </div>

      <h1 className="dashboard-title">
        {mode === DASHBOARD_MODES.FACULTY
          ? filters.reviewResidents
            ? 'داشبورد کیفیت مستندسازی دستیاران به تفکیک استاد ناظر'
            : 'داشبورد کیفیت پرونده‌های ثبت‌شده توسط اساتید'
          : 'داشبورد کیفیت پرونده‌های وارد شده توسط رزیدنت‌ها'}
      </h1>

      <KpiCards />

      <div className="u-container u-container--md filters-container">
        <DashboardFilters />
      </div>

      {mode === DASHBOARD_MODES.FACULTY &&
        filters.reviewResidents &&
        filters.selectedFaculty !== 'all' && (
          <div className="u-container u-container--md">
            <FacultyImpactChart faculty={filters.selectedFaculty} />
          </div>
        )}

      <div className="charts-grid-2">
        <GroupDonutChart />
        <FlagMembershipChart />
      </div>

      <div className="charts-grid-1">
        <LoadVsQualityChart />
        <QualityMixChart />
        <PdiRankingChart />
      </div>

      <AuditTable />

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onDataProcessed={handleDataProcessed}
      />
    </div>
  );
};

export default DashboardLayout;