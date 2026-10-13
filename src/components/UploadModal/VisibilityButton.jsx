import React from 'react';

const VisibilityButton = ({ visible, name, onClick }) => {
  const label = visible
    ? `پنهان کردن ${name}`
    : `نمایش ${name}`;

  return (
    <button
      type="button"
      className={`upload-modal-visibility ${
        visible ? '' : 'upload-modal-visibility--hidden'
      }`}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={!visible}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!visible && <path d="M3 3 21 21" />}
      </svg>
    </button>
  );
};

export default VisibilityButton;