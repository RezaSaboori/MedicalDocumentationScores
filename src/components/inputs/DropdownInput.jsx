import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import "../inputs.css";

export const DropdownInput = ({
  options = [],
  placeholder = "Select value...",
  className = "",
  chevronIcon,
  multiple = false,
  dir,
  value,
  onChange,
  displayValue,
  busy = false,
  searchable = false,
}) => {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [portalRoot, setPortalRoot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  const safeValue = multiple ? (Array.isArray(value) ? value : []) : value;

  // The portal target MUST be created after React's first commit.
  // Creating it during render (previous version) broke on page refresh:
  // React 18/19 resets the root container at the initial commit and removed
  // the div, leaving the portal detached and the dropdown invisible.
  useEffect(() => {
    const reactRoot = document.getElementById("root") || document.body;
    let root = document.getElementById("ui-dropdown-portals");
    if (!root) {
      root = document.createElement("div");
      root.id = "ui-dropdown-portals";
      reactRoot.appendChild(root);
    } else if (root.parentElement !== reactRoot) {
      reactRoot.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }
    const handler = (e) => {
      const target = e.target;
      if (ref.current?.contains(target) || panelRef.current?.contains(target)) return;
      if (target.closest?.(".ui-dropdown")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) => 
        String(opt).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const isSelected = (opt) =>
    multiple ? safeValue.includes(opt) : safeValue === opt;

  const handleSelect = (opt) => {
    if (multiple) {
      const next = safeValue.includes(opt)
        ? safeValue.filter((v) => v !== opt)
        : [...safeValue, opt];
      onChange(next);
    } else {
      setOpen(false);
      onChange(opt);
    }
  };

  const displayText = multiple
    ? displayValue !== undefined
      ? displayValue
      : safeValue.length > 0
        ? safeValue.join(", ")
        : ""
    : safeValue || "";

  const HIDDEN_PANEL_STYLE = {
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
    opacity: 0,
    pointerEvents: "none",
  };

  const [panelStyle, setPanelStyle] = useState(HIDDEN_PANEL_STYLE);

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current || ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const resolvedDir = dir || getComputedStyle(el).direction || "ltr";
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      direction: resolvedDir,
      textAlign: "start",
      visibility: "visible",
      opacity: 1,
      transform: "none",
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

  const resolvedDir = panelStyle.direction || "ltr";

  const panel = (
    <div
      ref={panelRef}
      dir={resolvedDir}
      className={`ui-dropdown__panel${open ? " is-open" : ""}`}
      style={panelStyle}
    >
      {searchable && (
        <div className="ui-dropdown__search">
          <input
            type="text"
            className="ui-dropdown__search-input"
            placeholder="جست‌وجو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
      )}
      <div className="ui-dropdown__list">
        {filteredOptions.map((opt) => (
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
        {filteredOptions.length === 0 && (
          <div className="ui-dropdown__item ui-dropdown__item--empty">نتیجه‌ای یافت نشد</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`ui-dropdown ${className}`.trim()} ref={ref}>
      <div
        ref={triggerRef}
        className={`ui-input-shell${open ? " ui-input-shell--open" : ""}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        style={{ cursor: busy ? "progress" : "pointer" }}
      >
        <span className={`ui-dropdown__text${!displayText ? " ui-dropdown__text--placeholder" : ""}`}>
          {displayText || placeholder}
        </span>
        <span
          className={`ui-dropdown__chevron${open ? " ui-dropdown__chevron--open" : ""}`}
          aria-hidden="true"
        >
          {chevronIcon}
        </span>
      </div>

      {portalRoot && ReactDOM.createPortal(panel, portalRoot)}
    </div>
  );
};