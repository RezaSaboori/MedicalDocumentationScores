import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatNumber, formatPercent } from '../../utils/formatters';
import './KpiCards.css';

const KpiCards = () => {
  const { data } = useDashboard();
  const d = data.current;

  const kpis = useMemo(() => {
    if (!d || d.length === 0) return null;
    const hasFlag = (flag) => d.filter(row => row.flags.includes(flag)).length;
    return {
      n_physicians: d.length,
      total_visits: d.reduce((sum, row) => sum + (row.V || 0), 0),
      mean_pdi: d.reduce((sum, row) => sum + (row.PDI || 0), 0) / d.length,
      mean_cov: d.reduce((sum, row) => sum + (row.COV || 0), 0) / d.length,
      mean_rho_z: d.reduce((sum, row) => sum + (row.rho_Z || 0), 0) / d.length,
      mean_rho_f: d.reduce((sum, row) => sum + (row.rho_F || 0), 0) / d.length,
      n_fraud: hasFlag('INTEGRITY_AUDIT'),
      n_lazy: hasFlag('ENGAGEMENT_TRAINING'),
      n_exemplar: hasFlag('EXEMPLAR'),
    };
  }, [d]);

  if (!kpis) return null;

  const cards = [
    { title: 'تعداد رزیدنت‌ها', value: formatNumber(kpis.n_physicians), color: 'var(--color-blue)' },
    { title: 'مجموع ویزیت‌ها', value: formatNumber(kpis.total_visits), color: 'var(--color-blue)' },
    { title: 'میانگین PDI', value: kpis.mean_pdi.toFixed(1), color: 'var(--color-blue)', sub: 'از 100' },
    { title: 'نسبت مستندسازی', value: formatPercent(kpis.mean_cov, 0), color: 'var(--color-green)' },
    { title: 'میانگین نرخ پرونده خالی', value: formatPercent(kpis.mean_rho_z, 0), color: 'var(--color-orange)' },
    { title: 'میانگین نرخ داده کاذب', value: formatPercent(kpis.mean_rho_f, 0), color: 'var(--color-red)' },
    { title: 'گروه مشکوک به داده کاذب', value: formatNumber(kpis.n_fraud), color: 'var(--color-red)', sub: 'پزشک' },
    { title: 'گروه کم‌حوصله', value: formatNumber(kpis.n_lazy), color: 'var(--color-orange)', sub: 'پزشک' },
    { title: 'گروه باحوصله', value: formatNumber(kpis.n_exemplar), color: 'var(--color-green)', sub: 'پزشک' },
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