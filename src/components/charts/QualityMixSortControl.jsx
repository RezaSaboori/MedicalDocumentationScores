import React from 'react';
import {
  DropdownInput,
} from '../inputs/DropdownInput';
import './QualityMixSortControl.css';

export const QUALITY_MIX_SORTS = {
  SCORE: 'score',
  VISITS: 'visits',
  CALIBRATED_SCORE: 'calibratedScore',
  SCORE_CHANGE: 'scoreChange',
  RANK_CHANGE: 'rankChange',
  ALPHABETICAL: 'alphabetical',
};

const SORT_OPTIONS = [
  {
    value: QUALITY_MIX_SORTS.SCORE,
    label: 'امتیاز کیفیت ثبت پرونده‌ها',
  },
  {
    value: QUALITY_MIX_SORTS.VISITS,
    label: 'ویزیت',
  },
  {
    value:
      QUALITY_MIX_SORTS.CALIBRATED_SCORE,
    label: 'میانگین نمره',
  },
  {
    value:
      QUALITY_MIX_SORTS.SCORE_CHANGE,
    label: 'تغییر امتیاز',
  },
  {
    value:
      QUALITY_MIX_SORTS.RANK_CHANGE,
    label: 'تغییر رتبه',
  },
  {
    value:
      QUALITY_MIX_SORTS.ALPHABETICAL,
    label: 'حروف الفبا',
  },
];

const ChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const QualityMixSortControl = ({
  value,
  onChange,
}) => {
  const selectedOption =
    SORT_OPTIONS.find(
      (option) =>
        option.value === value
    );

  const handleChange = (label) => {
    const option =
      SORT_OPTIONS.find(
        (item) =>
          item.label === label
      );

    if (option) {
      onChange(option.value);
    }
  };

  return (
    <div className="qm-sort-control">
      <span className="qm-sort-control__label">
        مرتب‌سازی
      </span>

      <DropdownInput
        dir="rtl"
        className="qm-sort-control__dropdown"
        options={SORT_OPTIONS.map(
          (option) => option.label
        )}
        value={
          selectedOption?.label || ''
        }
        onChange={handleChange}
        chevronIcon={<ChevronIcon />}
        placeholder="مرتب‌سازی..."
      />
    </div>
  );
};

export default QualityMixSortControl;