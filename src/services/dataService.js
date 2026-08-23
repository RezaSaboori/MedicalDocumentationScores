const API_BASE = 'http://localhost:3001';

export const uploadDataToServer = async (payload) => {
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'خطا در ذخیره سازی اطلاعات');
  }
  return res.json();
};

export const fetchSnapshots = async () => {
  const res = await fetch(`${API_BASE}/api/snapshots`);
  if (!res.ok) throw new Error('خطا در دریافت لیست بازه های زمانی');
  return res.json();
};

export const fetchDashboardData = async (period) => {
  const res = await fetch(`${API_BASE}/api/dashboard/${period}`);
  if (!res.ok) throw new Error('خطا در دریافت اطلاعات داشبورد');
  return res.json();
};