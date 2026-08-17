import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { QUALITY_CATEGORIES } from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';

const QualityMixChart = () => {
  const { data } = useDashboard();
  return (
    <QualityMixChartBase
      rows={data.current}
      scoreKey="PDI"
      categories={QUALITY_CATEGORIES}
      title="رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان"
      subtitle="مرتب‌شده از کمترین امتیاز تا بیشترین امتیاز"
    />
  );
};

export default QualityMixChart;