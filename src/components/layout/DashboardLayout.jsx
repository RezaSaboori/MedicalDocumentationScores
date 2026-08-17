import KpiCards from '../kpis/KpiCards';
import DashboardFilters from '../filters/DashboardFilters';
import GroupDonutChart from '../charts/GroupDonutChart';
import FlagMembershipChart from '../charts/FlagMembershipChart';
import ChartPlaceholder from '../charts/ChartPlaceholder';
import AuditTable from '../table/AuditTable';
import ModeToggle from './ModeToggle';
import { useDashboard } from '../../context/DashboardContext';
import { DASHBOARD_MODES } from '../../utils/constants';

const DashboardLayout = () => {
  const { mode, setMode } = useDashboard();

  return (
    <div className="page-content dashboard-wrapper">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
        <ModeToggle mode={mode} onModeChange={setMode} />
      </div>

      <h1 className="dashboard-title">
        {mode === DASHBOARD_MODES.FACULTY
          ? 'داشبورد کیفیت پرونده‌های وارد شده توسط اساتید'
          : 'داشبورد کیفیت پرونده‌های وارد شده توسط رزیدنت‌ها'}
      </h1>

      <KpiCards />

      <div className="glass u-container u-container--md filters-container">
        <DashboardFilters />
      </div>

      <div className="charts-grid-2">
        <GroupDonutChart />
        <FlagMembershipChart />
      </div>

      <div className="charts-grid-1">
        <ChartPlaceholder title="شاخص کیفیت تعدیل‌شده با بار کاری (LAQ)" />
        <ChartPlaceholder title="بار کاری دربرابر کیفیت" />
        <ChartPlaceholder title="نقشه ریسک" />
        <ChartPlaceholder title="رتبه بندی رزیدنت‌ها و توزیع کیفیت (PDI)" height="600px" />
        <ChartPlaceholder title="رتبه بندی رزیدنت‌ها و توزیع کیفیت (PDI_noF)" height="600px" />
        <ChartPlaceholder title="رتبه‌بندی شاخص ترکیبی مستندسازی (PDI)" height="600px" />
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