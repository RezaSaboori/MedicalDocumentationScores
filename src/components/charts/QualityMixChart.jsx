import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  DASHBOARD_MODES,
  QUALITY_CATEGORIES,
} from '../../utils/constants';
import QualityMixChartBase from './QualityMixChartBase';

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const toPersianDigits = (value) =>
  String(value ?? '').replace(
    /\d/g,
    (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]
  );

const formatPeriodLabel = (period) => {
  const match =
    String(period || '').match(
      /^(\d{4})[/-](\d{1,2})$/
    );

  if (!match) {
    return '';
  }

  const year = match[1];
  const monthIndex =
    Number(match[2]) - 1;

  if (
    monthIndex < 0 ||
    monthIndex >= JALALI_MONTHS.length
  ) {
    return '';
  }

  return `${JALALI_MONTHS[monthIndex]} ${toPersianDigits(year)}`;
};

const QualityMixChart = () => {
  const {
    data,
    mode,
    filters,
    selectedPeriod,
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

  const periodLabel =
    formatPeriodLabel(
      selectedPeriod
    );

  const chartTitle =
    periodLabel
      ? `${baseTitle} - ${periodLabel}`
      : baseTitle;

  return (
    <QualityMixChartBase
      rows={data.current}
      previousRows={data.previous}
      comparisonRows={data.allCurrent}
      comparisonPreviousRows={data.allPrevious}
      scoreKey="PDI"
      categories={QUALITY_CATEGORIES}
      positiveColor="#15C062"
      title={chartTitle}
    />
  );
};

export default QualityMixChart;