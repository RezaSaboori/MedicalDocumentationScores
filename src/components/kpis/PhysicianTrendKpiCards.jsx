import React from 'react';
import {
  PDI_THRESHOLD,
} from '../../utils/constants';
import {
  formatNumber,
  pdiGradientColor,
} from '../../utils/formatters';
import './PhysicianTrendKpiCards.css';

const formatPdi = (value) => {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number.toFixed(1)
    : '—';
};

const PhysicianTrendKpiCards = ({
  row,
}) => {
  if (!row) {
    return null;
  }

  const pdi =
    Number(row.PDI);

  const cards = [
    {
      key: 'rank',
      title: 'رتبه',
      value:
        row.current_rank ??
        '—',
      color:
        'var(--color-blue)',
    },

    {
      key: 'visits',
      title: 'ویزیت',
      value:
        formatNumber(
          row.V,
          0
        ),
      color:
        'var(--color-blue)',
    },

    {
      key: 'pdi',
      title:
        'امتیاز کیفیت ثبت پرونده‌ها',
      value:
        formatPdi(
          row.PDI
        ),
      color:
        Number.isFinite(pdi)
          ? pdiGradientColor(
              pdi,
              PDI_THRESHOLD
            )
          : 'var(--color-gray9)',
    },
  ];

  return (
    <div className="physician-trend-kpis">
      {cards.map(
        (card) => (
          <div
            key={card.key}
            className="glass u-container u-container--sm physician-trend-kpi"
          >
            <div className="physician-trend-kpi__title">
              {card.title}
            </div>

            <div
              className="physician-trend-kpi__value"
              style={{
                color:
                  card.color,
              }}
              title={String(
                card.value
              )}
            >
              {card.value}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PhysicianTrendKpiCards;