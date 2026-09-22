import React from 'react';
import {
  DropdownInput,
} from '../inputs/DropdownInput';
import './LoadVsQualityMetricControl.css';

export const LOAD_QUALITY_METRICS = {
  CALIBRATED: 'calibrated_score',
  RAW: 'raw_score',
};

const METRIC_OPTIONS = [
  {
    value:
      LOAD_QUALITY_METRICS.CALIBRATED,
    label:
      'میانگین نمرات پرونده‌ها - کالیبره‌شده',
  },
  {
    value:
      LOAD_QUALITY_METRICS.RAW,
    label:
      'میانگین نمرات پرونده‌ها - خام',
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

const LoadVsQualityMetricControl = ({
  value,
  onChange,
}) => {
  const selectedOption =
    METRIC_OPTIONS.find(
      (option) =>
        option.value === value
    );

  const handleChange = (label) => {
    const option =
      METRIC_OPTIONS.find(
        (item) =>
          item.label === label
      );

    if (option) {
      onChange(option.value);
    }
  };

  return (
    <div className="lvq-metric-control">
      <span className="lvq-metric-control__label">
        محور عمودی
      </span>

      <DropdownInput
        dir="rtl"
        className="lvq-metric-control__dropdown"
        options={METRIC_OPTIONS.map(
          (option) => option.label
        )}
        value={
          selectedOption?.label || ''
        }
        onChange={handleChange}
        chevronIcon={<ChevronIcon />}
        placeholder="انتخاب شاخص..."
      />
    </div>
  );
};

export default LoadVsQualityMetricControl;