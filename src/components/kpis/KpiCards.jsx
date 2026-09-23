import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { DASHBOARD_MODES } from '../../utils/constants';
import { Skeleton } from '../ui/Skeleton';
import './KpiCards.css';

const KpiCards = () => {
  const { data, loading, mode } = useDashboard();
  const d = data.current;

  const kpis = useMemo(() => {
    if (!d || d.length === 0) return null;

    return {
      n_physicians: d.length,
      total_visits: d.reduce((sum, row) => sum + (row.V || 0), 0),
      mean_pdi: d.reduce((sum, row) => sum + (row.PDI || 0), 0) / d.length,
      mean_cov: d.reduce((sum, row) => sum + (row.COV || 0), 0) / d.length,
      mean_rho_z: d.reduce((sum, row) => sum + (row.rho_Z || 0), 0) / d.length,
    };
  }, [d]);

  if (loading) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass u-container u-container--sm kpi-card">
            <Skeleton width="70%" height="0.9rem" />
            <Skeleton width="45%" height="1.6rem" />
          </div>
        ))}
      </div>
    );
  }

  if (!kpis) {
    return (
      <div
        className="glass u-container u-container--md"
        style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--color-gray9)', fontFamily: 'var(--font-family-base)' }}
      >
        داده‌ای مطابق فیلترهای انتخابی یافت نشد
      </div>
    );
  }

  const firstKpiTitle =
    mode === DASHBOARD_MODES.FACULTY
      ? 'تعداد اساتید'
      : 'تعداد رزیدنت‌ها';

  const cards = [
    { title: firstKpiTitle, value: formatNumber(kpis.n_physicians), color: 'var(--color-blue)' },
    { title: 'مجموع ویزیت‌ها', value: formatNumber(kpis.total_visits), color: 'var(--color-blue)' },
    { title: 'میانگین PDI', value: kpis.mean_pdi.toFixed(1), color: 'var(--color-blue)'},
    { title: 'نسبت مستندسازی', value: formatPercent(kpis.mean_cov, 0), color: 'var(--color-green)' },
    { title: 'میانگین نرخ پرونده خالی', value: formatPercent(kpis.mean_rho_z, 0), color: 'var(--color-orange)' },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card, i) => (
        <div key={i} className="glass u-container u-container--sm kpi-card">
          <div className="kpi-title">{card.title}</div>
          <div className="kpi-value" style={{ color: card.color }}>{card.value}</div>
          {card.sub && <div className="kpi-sub">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
};

export default KpiCards;