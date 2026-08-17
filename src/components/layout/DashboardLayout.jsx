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
import { useDashboard } from '../../context/DashboardContext';
import { DASHBOARD_MODES } from '../../utils/constants';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { mode, setMode, loading } = useDashboard();

  return (
    <div className="page-content dashboard-wrapper">
      <div className="dashboard-header">
        <ModeToggle mode={mode} onModeChange={setMode} busy={loading} />
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
    </div>
  );
};

export default DashboardLayout;