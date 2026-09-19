import { elementToSVG, inlineResources } from 'dom-to-svg';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const sanitizeFilename = (value) => {
  const cleaned = String(value || 'chart')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'chart';
};

const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });

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

  const sourceWidth = Math.ceil(element.getBoundingClientRect().width);
  const clone = element.cloneNode(true);

  clone.classList.add('chart-panel--exporting');

  clone
    .querySelectorAll('[data-export-ignore="true"]')
    .forEach((node) => node.remove());

  Object.assign(clone.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${sourceWidth}px`,
    maxWidth: 'none',
    height: 'auto',
    maxHeight: 'none',
    flex: 'none',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  document.body.appendChild(clone);

  try {
    await nextFrame();

    const svgDocument = elementToSVG(clone);

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
  } finally {
    clone.remove();
  }
};