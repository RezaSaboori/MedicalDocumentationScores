const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const toPersianDigits = (value) =>
  String(value ?? '').replace(
    /\d/g,
    (digit) =>
      '۰۱۲۳۴۵۶۷۸۹'[
        Number(digit)
      ]
  );

export const formatPeriodLabel = (
  period
) => {
  const match =
    String(period || '').match(
      /^(\d{4})[/-](\d{1,2})$/
    );

  if (!match) {
    return '';
  }

  const year = match[1];
  const monthIndex =
    Number(match[2]) - 1;

  if (
    monthIndex < 0 ||
    monthIndex >=
      JALALI_MONTHS.length
  ) {
    return '';
  }

  return `${
    JALALI_MONTHS[monthIndex]
  } ${toPersianDigits(year)}`;
};