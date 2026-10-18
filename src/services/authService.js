export const checkSession = async () => {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      'امکان بررسی وضعیت دسترسی وجود ندارد.'
    );
  }

  const result = await response.json();

  return result.authenticated === true;
};

export const loginWithPassword = async (password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (response.status === 429) {
    throw new Error(
      'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.'
    );
  }

  if (response.status === 401) {
    throw new Error('رمز عبور واردشده صحیح نیست.');
  }

  if (!response.ok) {
    throw new Error(
      'خطا در بررسی رمز عبور. لطفاً دوباره تلاش کنید.'
    );
  }

  return response.json();
};

export const logout = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('خروج از برنامه انجام نشد.');
  }

  return response.json();
};