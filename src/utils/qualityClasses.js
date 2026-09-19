const normalize = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

export const QUALITY_CLASSES = {
  0: {
    key: 'Q0',
    label: 'خالی',
    weight: 0,
    color: '#B0BEC5',
    textColor: '#263238',
  },
  1: {
    key: 'Q1',
    label: 'کمتر از حداقل انتظار',
    weight: 3,
    color: '#D84315',
    textColor: '#FFFFFF',
  },
  2: {
    key: 'Q2',
    label: 'حداقل قابل قبول',
    weight: 4,
    color: '#F28E2B',
    textColor: '#263238',
  },
  3: {
    key: 'Q3',
    label: 'سطح قابل قبول',
    weight: 5,
    color: '#BFD200',
    textColor: '#263238',
  },
  4: {
    key: 'Q4',
    label: 'خوب',
    weight: 6,
    color: '#38B000',
    textColor: '#FFFFFF',
  },
  5: {
    key: 'Q5',
    label: 'فراتر از انتظار',
    weight: 8,
    color: '#004B23',
    textColor: '#FFFFFF',
  },
};

export const QUALITY_CLASS_MAX_WEIGHT = 8;

export const QUALITY_CLASS_KEYS = Object.values(QUALITY_CLASSES).map(
  (item) => item.key
);

export const qualityWeightToStatus = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  let closestClass = 0;
  let smallestDistance = Infinity;

  Object.entries(QUALITY_CLASSES).forEach(
    ([classValue, item]) => {
      const distance = Math.abs(
        numericValue - item.weight
      );

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestClass = Number(classValue);
      }
    }
  );

  return QUALITY_CLASSES[closestClass].label;
};

export const QUALITY_CATEGORIES = Object.fromEntries(
  Object.values(QUALITY_CLASSES).map((item) => [
    item.key,
    {
      label: item.label,
      color: item.color,
      textColor: item.textColor,
    },
  ])
);

const STATUS_TO_CLASS = Object.fromEntries(
  Object.entries(QUALITY_CLASSES).map(([classValue, item]) => [
    normalize(item.label),
    Number(classValue),
  ])
);

export const resolveQualityClass = (status, calibratedClass) => {
  const normalizedStatus = normalize(status);

  if (Object.prototype.hasOwnProperty.call(STATUS_TO_CLASS, normalizedStatus)) {
    return STATUS_TO_CLASS[normalizedStatus];
  }

  const numericClass = Number(calibratedClass);

  if (
    Number.isInteger(numericClass) &&
    numericClass >= 0 &&
    numericClass <= 5
  ) {
    return numericClass;
  }

  return null;
};

export const qualityClassToStatus = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const classValue = Math.min(
    5,
    Math.max(0, Math.round(numericValue))
  );

  return QUALITY_CLASSES[classValue].label;
};