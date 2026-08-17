import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import "../inputs.css";

export const DropdownInput = ({
  options,
  placeholder = "Select value...",
  className = "",
  chevronIcon,
  multiple = false,
  dir,
  value,
  onChange,
  displayValue,
}) => {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const ref = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const target = e.target;
      const inSelf =
        ref.current?.contains(target) || panelRef.current?.contains(target);
      if (inSelf) return;
      const inOtherDropdown = target.closest?.(".ui-dropdown");
      if (inOtherDropdown) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const isSelected = (opt) =>
    multiple ? value.includes(opt) : value === opt;

  const handleSelect = (opt) => {
    if (multiple) {
      const next = value.includes(opt)
        ? value.filter((v) => v !== opt)
        : [...value, opt];
      onChange(next);
    } else {
      setOpen(false);
      onChange(opt);
    }
  };

  const displayText = multiple
    ? displayValue !== undefined
      ? displayValue
      : value.length > 0
        ? value.join(", ")
        : ""
    : value;

  const triggerRef = useRef(null);

  const [panelStyle, setPanelStyle] = useState({
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
  });

  const HIDDEN_PANEL_STYLE = {
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
    pointerEvents: "none",
  };

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const resolvedDir = dir ?? (getComputedStyle(el).direction);
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      direction: resolvedDir,
      textAlign: "start",
      visibility: "visible",
      pointerEvents: "auto",
    });
  }, [dir]);

  useEffect(() => {
    if (!open) {
      setPanelStyle(HIDDEN_PANEL_STYLE);
      return;
    }
    updatePanelPosition();
    window.addEventListener("scroll", updatePanelPosition, true);
    window.addEventListener("resize", updatePanelPosition);
    return () => {
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [open, updatePanelPosition]);

  const portalRoot = useMemo(() => {
    if (typeof document === "undefined") return null;
    const reactRoot = document.getElementById("root");
    if (!reactRoot) return document.body;
    let root = document.getElementById("ui-dropdown-portals");
    if (!root) {
      root = document.createElement("div");
      root.id = "ui-dropdown-portals";
      reactRoot.appendChild(root);
    } else if (root.parentElement !== reactRoot) {
      reactRoot.appendChild(root);
    }
    return root;
  }, []);

  const resolvedDir = panelStyle.direction ?? "ltr";

  const panel = (
    <div
      ref={panelRef}
      dir={resolvedDir}
      className={`ui-dropdown__panel${open ? " is-open" : ""}`}
      style={panelStyle}
    >
      <div className="ui-dropdown__list">
        {options.map((opt) => (
          <div
            key={opt}
            className={`ui-dropdown__item${
              isSelected(opt)
                ? " is-selected blue-glass"
                : hoveredOption === opt
                  ? " glass"
                  : ""
            }`}
            role="option"
            aria-selected={isSelected(opt)}
            onMouseEnter={() => setHoveredOption(opt)}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={() => handleSelect(opt)}
          >
            {multiple && (
              <span className="ui-dropdown__check">
                {isSelected(opt) ? "✓" : ""}
              </span>
            )}
            {opt}
          </div>
        ))}
        {options.length === 0 && (
          <div className="ui-dropdown__item ui-dropdown__item--empty">No results</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`ui-dropdown ${className}`} ref={ref}>
      <div
        ref={triggerRef}
        className={`ui-input-shell${open ? " ui-input-shell--open" : ""}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
          if (e.key === "Escape") setOpen(false);
        }}
        style={{ cursor: "pointer" }}
      >
        <span className={`ui-dropdown__text${!displayText ? " ui-dropdown__text--placeholder" : ""}`}>
          {displayText || placeholder}
        </span>
        <button
          className="glass dz-icon-btn"
          type="button"
          tabIndex={-1}
          aria-hidden="true"
        >
          {React.cloneElement(chevronIcon, {
            className: `dz-icon-btn__icon ui-chevron-icon${open ? " ui-chevron-icon--open" : ""}`,
          })}
        </button>
      </div>

      {portalRoot && ReactDOM.createPortal(panel, portalRoot)}
    </div>
  );
};