import { useEffect } from "react";

export const useModeIndicator = (containerRef, activeModeId, deps = []) => {
  useEffect(() => {
    const updateActiveIndicator = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      const activeItem = activeModeId
        ? container.querySelector(`#${activeModeId}`)
        : null;

      if (!activeItem) {
        container.style.setProperty("--active-indicator-opacity", "0");
        setTimeout(() => {
          container.style.setProperty("--active-indicator-width", "0px");
          container.style.setProperty("--active-indicator-left", "0px");
        }, 200);
        return;
      }

      container.style.setProperty("--active-indicator-opacity", "1");
      container.style.setProperty("--active-indicator-width", `${activeItem.offsetWidth}px`);
      container.style.setProperty("--active-indicator-left", `${activeItem.offsetLeft}px`);
    };

    updateActiveIndicator();
    window.addEventListener("resize", updateActiveIndicator);

    return () => {
      window.removeEventListener("resize", updateActiveIndicator);
    };
  }, [activeModeId, containerRef, ...deps]);
};