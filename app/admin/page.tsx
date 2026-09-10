'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('Неверный пароль');
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={submit}>
        <h1>Sami Flowers — управление</h1>
        <p>Введите пароль владельца, чтобы редактировать каталог.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoFocus
        />
        <button type="submit" disabled={loading || !password}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
        {error && <div className="admin-login-error">{error}</div>}
      </form>
    </div>
  );
}
