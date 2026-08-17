import React from 'react';
import KpiCards from '../kpis/KpiCards';
import DashboardFilters from '../filters/DashboardFilters';
import GroupDonutChart from '../charts/GroupDonutChart';
import FlagMembershipChart from '../charts/FlagMembershipChart';
import LaqDistributionChart from '../charts/LaqDistributionChart';
import LoadVsQualityChart from '../charts/LoadVsQualityChart';
import IntegrityMapChart from '../charts/IntegrityMapChart';
import PdiRankingChart from '../charts/PdiRankingChart';
import ChartPlaceholder from '../charts/ChartPlaceholder';
import AuditTable from '../table/AuditTable';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="page-content dashboard-wrapper">
      <h1 className="dashboard-title">داشبورد کیفیت پرونده‌های وارد شده توسط رزیدنت‌ها</h1>
      
      <KpiCards />
      
      <div className="glass u-container u-container--md filters-container">
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
        <ChartPlaceholder title="رتبه بندی رزیدنت‌ها و توزیع کیفیت (PDI)" height="600px" />
        <ChartPlaceholder title="رتبه بندی رزیدنت‌ها و توزیع کیفیت (PDI_noF)" height="600px" />
        <PdiRankingChart />
      </div>

      <div className="glass u-container u-container--md">
        <h3 className="table-section-title">جدول ممیزی — قابل جست‌وجو، مرتب‌سازی و خروجی Excel</h3>
        <AuditTable />
      </div>
    </div>
  );
};

export default DashboardLayout;