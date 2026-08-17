import React from "react";
import "../inputs.css";

export const RadioToggle = ({
  checked,
  onChange,
  label = "Required ?",
  className = "",
}) => {
  return (
    <button
      type="button"
      className={`ui-radio-toggle${checked ? " ui-radio-toggle--checked" : ""} ${className}`}
      onClick={() => onChange(!checked)}
      aria-label={label}
      aria-pressed={checked}
    >
      <span className={`ui-radio-toggle__dot ${checked ? "red-glass" : "glass"}`} />
      <span className="ui-radio-toggle__label">{label}</span>
    </button>
  );
};