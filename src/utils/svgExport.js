import { domToSvg } from 'modern-screenshot';

const sanitizeFilename = (value) => {
  const cleaned = String(value || 'chart')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'chart';
};

const waitForLayout = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
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

const createExportClone = (element) => {
  const sourceRect = element.getBoundingClientRect();
  const sourceStyle = window.getComputedStyle(element);

  const stage = document.createElement('div');

  stage.setAttribute(
    'dir',
    sourceStyle.direction === 'ltr' ? 'ltr' : 'rtl'
  );

  Object.assign(stage.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${Math.ceil(sourceRect.width)}px`,
    margin: '0',
    padding: '0',
    pointerEvents: 'none',
    zIndex: '-2147483648',
  });

  const clone = element.cloneNode(true);

  clone.classList.add('chart-panel--exporting');

  Object.assign(clone.style, {
    width: `${Math.ceil(sourceRect.width)}px`,
    maxWidth: 'none',
    height: 'auto',
    maxHeight: 'none',
    margin: '0',
    flex: 'none',
  });

  const downloadButton = clone.querySelector(
    '.chart-panel__download'
  );

  if (downloadButton) {
    downloadButton.style.visibility = 'hidden';
  }

  stage.appendChild(clone);
  document.body.appendChild(stage);

  return {
    stage,
    clone,
  };
};

export const downloadElementAsSvg = async (element, title) => {
  if (!element) {
    throw new Error('SVG export target was not found.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const { stage, clone } = createExportClone(element);

  try {
    await waitForLayout();

    const exportRect = clone.getBoundingClientRect();
    const width = Math.ceil(exportRect.width);
    const height = Math.ceil(exportRect.height);

    const svgDataUrl = await domToSvg(clone, {
      width,
      height,
      scale: 1,
      backgroundColor: null,
      font: {
        preferredFormat: 'woff',
      },
    });

    const response = await fetch(svgDataUrl);

    if (!response.ok) {
      throw new Error('Failed to create SVG download.');
    }

    const blob = await response.blob();

    downloadBlob(
      blob,
      `${sanitizeFilename(title)}.svg`
    );
  } finally {
    stage.remove();
  }
};