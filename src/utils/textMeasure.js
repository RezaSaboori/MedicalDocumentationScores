let context = null;

/**
 * Measures the rendered pixel width of a text string for a given CSS font.
 * Used to size chart margins exactly (Nivo cannot auto-fit margins).
 */
export const measureTextWidth = (text, font) => {
  if (typeof document === 'undefined' || !text) return 0;
  if (!context) context = document.createElement('canvas').getContext('2d');
  context.font = font;
  return context.measureText(text).width;
};