import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height, radius, className = '' }) => (
  <div
    className={`skeleton ${className}`.trim()}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);