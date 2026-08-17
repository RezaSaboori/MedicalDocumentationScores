import React, { useRef, useEffect } from "react";
import "../inputs.css";

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  icon,
  multiline = false,
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!multiline || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "1px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, multiline]);

  const shellClass = `ui-input-shell${multiline ? " ui-input-shell--grow" : ""} ${className}`.trim();

  return (
    <div className={shellClass}>
      {multiline ? (
        <textarea
          ref={textareaRef}
          className="ui-input-field ui-input-field--textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          rows={1}
        />
      ) : (
        <input
          className="ui-input-field"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      )}
      {icon}
    </div>
  );
};