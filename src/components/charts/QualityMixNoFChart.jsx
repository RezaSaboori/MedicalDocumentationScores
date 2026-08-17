import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { QUALITY_CATEGORIES_NO_F } from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';

const QualityMixNoFChart = () => {
  const { data } = useDashboard();
  return (
    <QualityMixChartBase
      rows={data.current}
      scoreKey="PDI_noF"
      categories={QUALITY_CATEGORIES_NO_F}
      title="رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان (PDI_noF)"
      subtitle="مرتب‌شده از کمترین امتیاز تا بیشترین امتیاز (بدون احتساب داده‌های کاذب)"
    />
  );
};

export default QualityMixNoFChart;