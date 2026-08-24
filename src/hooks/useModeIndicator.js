import { useEffect } from "react";

export const useModeIndicator = (containerRef, activeModeId, deps = []) => {
  useEffect(() => {
    const updateActiveIndicator = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      const activeItem = activeModeId
        ? container.querySelector(`#${activeModeId}`)
        : null;

      if (!activeItem || activeItem.offsetWidth === 0) {
        container.style.setProperty("--active-indicator-opacity", "0");
        return;
      }

      container.style.setProperty("--active-indicator-opacity", "1");
      container.style.setProperty("--active-indicator-width", `${activeItem.offsetWidth}px`);
      container.style.setProperty("--active-indicator-left", `${activeItem.offsetLeft}px`);
    };

    // Use requestAnimationFrame to ensure layout is complete before measuring
    const rafId = requestAnimationFrame(() => {
      updateActiveIndicator();
    });

    window.addEventListener("resize", updateActiveIndicator);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateActiveIndicator);
    };
  }, [activeModeId, containerRef, ...deps]);
};