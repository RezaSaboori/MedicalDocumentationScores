import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  DASHBOARD_MODES,
  QUALITY_CATEGORIES,
} from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';
import {
  toPersianDigits,
} from '../../utils/period';

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

  const residentScopeTitle =
    filters.selectedYear !== 'all'
      ? `رتبه‌بندی رزیدنت‌های سال ${toPersianDigits(
          filters.selectedYear
        )} و توزیع کیفیت پرونده‌های آنان`
      : 'رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان';

  const baseTitle =
    showingResidents
      ? residentScopeTitle
      : reviewingResidents
        ? 'رتبه‌بندی اساتید بر اساس کیفیت مستندسازی دستیاران تحت نظارت'
        : 'رتبه‌بندی اساتید و توزیع کیفیت پرونده‌های ثبت‌شده توسط خود آنان';

  return (
    <QualityMixChartBase
      rows={data.current}
      previousRows={data.previous}
      comparisonRows={data.allCurrent}
      comparisonPreviousRows={data.allPrevious}
      scoreKey="PDI"
      categories={QUALITY_CATEGORIES}
      positiveColor="#15C062"
      title={baseTitle}
    />
  );
};

export default QualityMixChart;