import { elementToSVG, inlineResources } from 'dom-to-svg';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const sanitizeFilename = (value) => {
  const cleaned = String(value || 'chart')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'chart';
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadElementAsSvg = async (element, title) => {
  if (!element) {
    throw new Error('SVG export target was not found.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const body = element.querySelector('.chart-panel__body');
  const previousScrollTop = body?.scrollTop ?? 0;
  const previousScrollLeft = body?.scrollLeft ?? 0;

  let svgDocument;

  try {
    /*
     * Export the real laid-out panel instead of a re-parented clone.
     * The export class temporarily expands the scrollable chart body.
     *
     * No animation frame is awaited here, so the expanded state is measured
     * synchronously by the exporter and is not painted to the screen.
     */
    element.classList.add('chart-panel--exporting');

    if (body) {
      body.scrollTop = 0;
      body.scrollLeft = 0;
    }

    // Force synchronous layout after applying the export-only rules.
    void element.offsetHeight;

    svgDocument = elementToSVG(element);
  } finally {
    element.classList.remove('chart-panel--exporting');

    if (body) {
      body.scrollTop = previousScrollTop;
      body.scrollLeft = previousScrollLeft;
    }
  }

  await inlineResources(svgDocument.documentElement);

  const svgTitle = svgDocument.createElementNS(
    SVG_NAMESPACE,
    'title'
  );

  svgTitle.textContent = title;

  svgDocument.documentElement.insertBefore(
    svgTitle,
    svgDocument.documentElement.firstChild
  );

  const svgString = new XMLSerializer().serializeToString(svgDocument);

  const blob = new Blob(
    [svgString],
    { type: 'image/svg+xml;charset=utf-8' }
  );

  downloadBlob(
    blob,
    `${sanitizeFilename(title)}.svg`
  );
};