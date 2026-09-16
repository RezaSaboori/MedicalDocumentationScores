import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { QUALITY_CATEGORIES } from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';

const QualityMixNoFChart = () => {
  const { data } = useDashboard();

  return (
    <QualityMixChartBase
      rows={data.current}
      previousRows={data.previous}
      comparisonRows={data.allCurrent}
      comparisonPreviousRows={data.allPrevious}
      scoreKey="PDI_noF"
      categories={QUALITY_CATEGORIES}
      positiveColor="#15C062"
      title="رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان (PDI_noF)"
      subtitle="مرتب‌شده از کمترین امتیاز تا بیشترین امتیاز"
    />
  );
};

export default QualityMixNoFChart;