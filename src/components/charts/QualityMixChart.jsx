import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  DASHBOARD_MODES,
  QUALITY_CATEGORIES,
} from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';

const QualityMixChart = () => {
  const {
    data,
    mode,
    filters,
  } = useDashboard();

  const showingResidents =
    mode === DASHBOARD_MODES.RESIDENTS;

  const reviewingResidents =
    mode === DASHBOARD_MODES.FACULTY &&
    filters.reviewResidents;

  return (
    <QualityMixChartBase
      rows={data.current}
      previousRows={data.previous}
      comparisonRows={data.allCurrent}
      comparisonPreviousRows={data.allPrevious}
      scoreKey="PDI"
      categories={QUALITY_CATEGORIES}
      positiveColor="#15C062"
      title={
        showingResidents
          ? 'رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان'
          : reviewingResidents
            ? 'رتبه‌بندی اساتید بر اساس کیفیت مستندسازی دستیاران تحت نظارت'
            : 'رتبه‌بندی اساتید و توزیع کیفیت پرونده‌های ثبت‌شده توسط خود آنان'
      }
      subtitle="مرتب‌شده از بیشترین امتیاز تا کمترین امتیاز"
    />
  );
};

export default QualityMixChart;