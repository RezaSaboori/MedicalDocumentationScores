export const normalizePersianName = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/[يىئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/[أإٱ]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/ء/g, '')
    .replace(/[\u200C\u200D\u200E\u200F\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const personNameKey = (value) =>
  normalizePersianName(value).replace(/\s+/g, '');

export const normalizeResidentYear = (value) => {
  const year = String(value ?? '')
    .normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x06F0)
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660)
    )
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^سال\s*/, '');

  const years = {
    '1': '1',
    'اول': '1',
    'یکم': '1',
    '2': '2',
    'دوم': '2',
    '3': '3',
    'سوم': '3',
    '4': '4',
    'چهارم': '4',
    'فلوشیپ': 'فلوشیپ',
  };

  return years[year] || null;
};

export const isPersonnelVisible = (person) =>
  person?.visible !== false &&
  Number(person?.visible ?? 1) !== 0;