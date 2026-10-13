import * as XLSX from 'xlsx';
import {
  normalizePersianName,
  personNameKey,
  normalizeResidentYear,
} from '../../shared/personnel.js';

export const parsePersonnelCSV = async (file, type) => {
  if (!['resident', 'faculty'].includes(type)) {
    throw new Error('نوع فایل مشخصات نامعتبر است.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const workbook = XLSX.read(bytes, {
    type: 'array',
    raw: true,
  });

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  });

  if (!data.length) {
    throw new Error('فایل CSV خالی است.');
  }

  const headers = data[0].map((value) =>
    normalizePersianName(value).replace(/\s+/g, '')
  );

  const firstNameIndex = headers.indexOf('نام');
  const lastNameIndex = headers.indexOf('نامخانوادگی');
  const yearIndex = headers.indexOf('سالدستیاری');

  if (firstNameIndex === -1 || lastNameIndex === -1) {
    throw new Error(
      'ستون‌های «نام» و «نام خانوادگی» یافت نشدند.'
    );
  }

  if (type === 'resident' && yearIndex === -1) {
    throw new Error('ستون «سال دستیاری» یافت نشد.');
  }

  const seen = new Set();
  const people = [];

  for (let index = 1; index < data.length; index += 1) {
    const cells = data[index];

    const firstName = normalizePersianName(
      cells[firstNameIndex]
    );

    const lastName = normalizePersianName(
      cells[lastNameIndex]
    );

    if (!firstName && !lastName) continue;

    if (!firstName || !lastName) {
      throw new Error(
        `نام یا نام خانوادگی در ردیف ${index + 1} خالی است.`
      );
    }

    const name = `${firstName} ${lastName}`;
    const key = personNameKey(name);

    if (seen.has(key)) {
      throw new Error(
        `نام تکراری در فایل CSV: ${name}`
      );
    }

    seen.add(key);

    const person = {
      name,
      visible: 1,
    };

    if (type === 'resident') {
      person.year = normalizeResidentYear(
        cells[yearIndex]
      );
    }

    people.push(person);
  }

  return people;
};