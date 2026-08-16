import React from 'react';
import KpiCards from '../kpis/KpiCards';
import DashboardFilters from '../filters/DashboardFilters';
import ChartPlaceholder from '../charts/ChartPlaceholder';
import AuditTable from '../table/AuditTable';

const DashboardLayout = () => {
  return (
    <div className="page-content" dir="rtl">
      <h1 style={{ 
        textAlign: 'center', 
        color: 'var(--color-gray12)', 
        marginBottom: 'var(--spacing-xl)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        داشبورد کیفیت پرونده‌های وارد شده توسط رزیدنت‌ها
      </h1>
      
      <KpiCards />
      
      <div className="glass u-container u-container--md" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <DashboardFilters />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 'var(--spacing-lg)', 
        marginBottom: 'var(--spacing-xl)' 
      }}>
        <ChartPlaceholder title="تقاطع گروه‌های رفتاری" />
        <ChartPlaceholder title="توزیع پزشکان در گروه های رفتاری" />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: 'var(--spacing-lg)', 
        marginBottom: 'var(--spacing-xl)' 
      }}>
        <ChartPlaceholder title="شاخص کیفیت تعدیل‌شده با بار کاری (LAQ)" />
        <ChartPlaceholder title="بار کاری دربرابر کیفیت" />
        <ChartPlaceholder title="نقشه ریسک" />
        <ChartPlaceholder title="رتبه بندی رزیدنت‌ها و توزیع کیفیت (PDI)" height="600px" />
        <ChartPlaceholder title="رتبه بندی رزیدنت‌ها و توزیع کیفیت (PDI_noF)" height="600px" />
        <ChartPlaceholder title="رتبه‌بندی شاخص ترکیبی مستندسازی (PDI)" height="600px" />
      </div>

      <div className="glass u-container u-container--md">
        <h3 style={{ 
          margin: 0, 
          marginBottom: 'var(--spacing-md)', 
          color: 'var(--color-gray12)',
          fontWeight: 'var(--font-weight-semibold)'
        }}>
          جدول ممیزی — قابل جست‌وجو، مرتب‌سازی و خروجی Excel
        </h3>
        <AuditTable />
      </div>
    </div>
  );
};

export default DashboardLayout;