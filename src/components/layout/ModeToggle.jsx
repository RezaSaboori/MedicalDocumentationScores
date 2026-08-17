import React, { useRef } from 'react';
import { useModeIndicator } from '../../hooks/useModeIndicator';
import { DASHBOARD_MODES } from '../../utils/constants';
import './ModeToggle.css';

const ModeToggle = ({ mode, onModeChange }) => {
  const containerRef = useRef(null);
  useModeIndicator(containerRef, `mode-btn-${mode}`, [mode]);

  return (
    <div className="mode-toggle" ref={containerRef} role="tablist" aria-label="نوع کاربر">
      <button
        id="mode-btn-faculty"
        type="button"
        role="tab"
        aria-selected={mode === DASHBOARD_MODES.FACULTY}
        className={`mode-toggle__btn${mode === DASHBOARD_MODES.FACULTY ? ' is-active' : ''}`}
        onClick={() => onModeChange(DASHBOARD_MODES.FACULTY)}
      >
        هیئت علمی
      </button>
      <button
        id="mode-btn-residents"
        type="button"
        role="tab"
        aria-selected={mode === DASHBOARD_MODES.RESIDENTS}
        className={`mode-toggle__btn${mode === DASHBOARD_MODES.RESIDENTS ? ' is-active' : ''}`}
        onClick={() => onModeChange(DASHBOARD_MODES.RESIDENTS)}
      >
        دستیاران
      </button>
    </div>
  );
};

export default ModeToggle;