import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { QUALITY_CATEGORIES } from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';

const QualityMixChart = () => {
  const { data } = useDashboard();
  return (
    <QualityMixChartBase
      rows={data.current}
      previousRows={data.previous}
      comparisonRows={data.allCurrent}
      comparisonPreviousRows={data.allPrevious}
      scoreKey="PDI"
      categories={QUALITY_CATEGORIES}
      positiveColor="#049C49"
      title="رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان"
      subtitle="مرتب‌شده از کمترین امتیاز تا بیشترین امتیاز"
    />
  );
};

export default QualityMixChart;