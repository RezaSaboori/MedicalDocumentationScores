import React from "react";
import "../inputs.css";

export const NumberInput = ({
  value,
  onChange,
  onBlur,
  placeholder = "Enter number...",
  min,
  max,
  className = "",
  dir,
  id,
}) => {
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") { onChange(raw); return; }
    if (isNaN(parseFloat(raw))) return;
    onChange(raw);
  };

  const handleBlur = () => {
    if (value === "" || value === "-") { onBlur?.(); return; }
    const num = parseFloat(value);
    if (isNaN(num)) { onBlur?.(); return; }
    if (min != null && num < min) onChange(String(min));
    else if (max != null && num > max) onChange(String(max));
    onBlur?.();
  };

  return (
    <div className={`ui-input-shell ${className}`}>
      <input
        id={id}
        className="ui-input-field"
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        step="any"
        dir={dir}
      />
    </div>
  );
};