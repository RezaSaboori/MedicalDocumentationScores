import React, { useState } from 'react';
import KpiCards from '../kpis/KpiCards';
import DashboardFilters from '../filters/DashboardFilters';
import GroupDonutChart from '../charts/GroupDonutChart';
import FlagMembershipChart from '../charts/FlagMembershipChart';
import LaqDistributionChart from '../charts/LaqDistributionChart';
import LoadVsQualityChart from '../charts/LoadVsQualityChart';
import IntegrityMapChart from '../charts/IntegrityMapChart';
import QualityMixChart from '../charts/QualityMixChart';
import QualityMixNoFChart from '../charts/QualityMixNoFChart';
import PdiRankingChart from '../charts/PdiRankingChart';
import AuditTable from '../table/AuditTable';
import ModeToggle from './ModeToggle';
import { UploadModal } from '../UploadModal/UploadModal';
import { useDashboard } from '../../context/DashboardContext';
import { DASHBOARD_MODES } from '../../utils/constants';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { mode, setMode, loading } = useDashboard();
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
          className="btn btn-primary"
          style={{ marginRight: '1rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--color-primary, #2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          بارگذاری فایل جدید
        </button>
      </div>

      <h1 className="dashboard-title">
        {mode === DASHBOARD_MODES.FACULTY
          ? 'داشبورد کیفیت پرونده‌های وارد شده توسط اساتید'
          : 'داشبورد کیفیت پرونده‌های وارد شده توسط رزیدنت‌ها'}
      </h1>

      <KpiCards />

      <div className="u-container u-container--md filters-container">
        <DashboardFilters />
      </div>

      <div className="charts-grid-2">
        <GroupDonutChart />
        <FlagMembershipChart />
      </div>

      <div className="charts-grid-1">
        <LaqDistributionChart />
        <LoadVsQualityChart />
        <IntegrityMapChart />
        <QualityMixChart />
        <QualityMixNoFChart />
        <PdiRankingChart />
      </div>

      <div className="glass u-container u-container--md">
        <h3 className="table-section-title">
          جدول ممیزی — قابل جست‌وجو، مرتب‌سازی و خروجی Excel
        </h3>
        <AuditTable />
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onDataProcessed={handleDataProcessed}
      />
    </div>
  );
};

export default DashboardLayout;